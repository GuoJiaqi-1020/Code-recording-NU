# import standard plotting and animation
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
from IPython.display import clear_output

# import autograd functionality
from autograd import grad as compute_grad   # The only autograd function you may ever need
import autograd.numpy as np
from autograd import hessian as compute_hess
import math
import time
from matplotlib import gridspec
import copy
from matplotlib.ticker import FormatStrFormatter

class Visualizer:
    '''
    Visualize linear regression in 2 and 3 dimensions.  For single input cases (2 dimensions) the path of gradient descent on the cost function can be animated.
    '''
    #### initialize ####
    def __init__(self,csvname):
        # grab input
        data = np.loadtxt(csvname,delimiter = ',')
        data = data.T
        self.x = data[:,:-1]
        self.y = data[:,-1]

    # center the data
    def center_data(self):
        # center data
        self.x = self.x - np.mean(self.x)
        self.y = self.y - np.mean(self.y)
        
        bigx = max(abs(min(self.x)),abs(max(self.x)))
        self.x = [v/float(bigx) for v in self.x]
        
        bigy = max(abs(min(self.y)),abs(max(self.y)))
        self.y = [v/float(bigy) for v in self.y]
    
    ######## plotters ########
    def static_img(self,w_best,cost,predict,**kwargs):
        # or just take last weights
        self.w = w_best
        #self.center_data()

        # initialize figure
        fig = 0
        show_cost = False
        if 'f1_x' in kwargs or 'f2_x' in kwargs:
            fig = plt.figure(figsize = (9,4))
            gs = gridspec.GridSpec(1, 2,width_ratios = [1,1]) 
        else:
            fig = plt.figure(figsize = (9,3))
            gs = gridspec.GridSpec(1, 3,width_ratios = [1,1,1]) 

        # setup current axis
        ax = plt.subplot(gs[1]);

        #### left plot - data and fit in original space ####
        # scatter original points
        self.scatter_pts(ax,self.x)
        ax.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
        ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
        
        # create fit
        gapx = (max(self.x) - min(self.x))*0
        s = np.linspace(min(self.x) - gapx,max(self.x) + gapx,100)
        t = [predict(np.asarray([v]),self.w) for v in s]
        
        # plot fit
        ax.plot(s,t,c = 'lime')
        ax.xaxis.set_major_formatter(FormatStrFormatter('%.1f'))
        ax.yaxis.set_major_formatter(FormatStrFormatter('%.1f'))
        
        #### plot data in new space in middle panel (or right panel if cost function decrease plot shown ) #####
        if 'f1_x' in kwargs:
            # scatter points
            f1_x = kwargs['f1_x']
            ax2 = plt.subplot(gs[1],aspect = 'equal');
            self.scatter_pts(ax2,f1_x)

            # create and plot fit
            s = np.linspace(min(f1_x) - 0.1,max(f1_x) + 0.1,100)
            t = self.w[0] + self.w[1]*s
            ax2.plot(s,t,c = 'lime')
            ax2.set_xlabel(r'$f\,(x)$', fontsize = 14,labelpad = 10)
            ax2.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
            ax2.xaxis.set_major_formatter(FormatStrFormatter('%.1f'))
            ax2.yaxis.set_major_formatter(FormatStrFormatter('%.1f'))

        
        if 'f2_x' in kwargs:
            ax2 = plt.subplot(gs[1],projection = '3d');   
            view = kwargs['view']
            
            # get input
            f1_x = kwargs['f1_x']
            f2_x = kwargs['f2_x']

            # scatter points
            f1_x = np.asarray(f1_x)
            f1_x.shape = (len(f1_x),1)
            f2_x = np.asarray(f2_x)
            f2_x.shape = (len(f2_x),1)
            xtran = np.concatenate((f1_x,f2_x),axis = 1)
            self.scatter_pts(ax2,xtran)

            # create and plot fit
            s1 = np.linspace(min(f1_x) - 0.1,max(f1_x) + 0.1,100)
            s2 = np.linspace(min(f2_x) - 0.1,max(f2_x) + 0.1,100)
            t1,t2 = np.meshgrid(s1,s2)
            
            # compute fitting hyperplane
            t1.shape = (len(s1)**2,1)
            t2.shape = (len(s2)**2,1)
            r = self.w[0] + self.w[1]*t1 + self.w[2]*t2
            
            # reshape for plotting
            t1.shape = (len(s1),len(s1))
            t2.shape = (len(s2),len(s2))
            r.shape = (len(s1),len(s2))
            ax2.plot_surface(t1,t2,r,alpha = 0.1,color = 'lime',rstride=15, cstride=15,linewidth=1,edgecolor = 'k')
            
            # label axes
            self.move_axis_left(ax2)
            ax2.set_xlabel(r'$f_1(x)$', fontsize = 12,labelpad = 5)
            ax2.set_ylabel(r'$f_2(x)$', rotation = 0,fontsize = 12,labelpad = 5)
            ax2.set_zlabel(r'$y$', rotation = 0,fontsize = 12,labelpad = 0)
            ax2.view_init(view[0],view[1])
            
            ax2.xaxis.set_major_formatter(FormatStrFormatter('%.1f'))
            ax2.yaxis.set_major_formatter(FormatStrFormatter('%.1f'))
            
        # plot cost function decrease
        if  show_cost == True: 
            # compute cost eval history
            g = cost
            cost_evals = []
            for i in range(len(w_hist)):
                W = w_hist[i]
                cost = g(W)
                cost_evals.append(cost)
     
            # plot cost path - scale to fit inside same aspect as classification plots
            num_iterations = len(w_hist)
            minx = min(self.x)
            maxx = max(self.x)
            gapx = (maxx - minx)*0.1
            minc = min(cost_evals)
            maxc = max(cost_evals)
            gapc = (maxc - minc)*0.1
            minc -= gapc
            maxc += gapc
            
            s = np.linspace(minx + gapx,maxx - gapx,num_iterations)
            scaled_costs = [c/float(max(cost_evals))*(maxx-gapx) - (minx+gapx) for c in cost_evals]
            ax3.plot(s,scaled_costs,color = 'k',linewidth = 1.5)
            ax3.set_xlabel('iteration',fontsize = 12)
            ax3.set_title('cost function plot',fontsize = 12)
            
            # rescale number of iterations and cost function value to fit same aspect ratio as other two subplots
            ax3.set_xlim(minx,maxx)
            #ax3.set_ylim(minc,maxc)
            
            ### set tickmarks for both axes - requries re-scaling   
            # x axis
            marks = range(0,num_iterations,round(num_iterations/5.0))
            ax3.set_xticks(s[marks])
            labels = [item.get_text() for item in ax3.get_xticklabels()]
            ax3.set_xticklabels(marks)
            
            ### y axis
            r = (max(scaled_costs) - min(scaled_costs))/5.0
            marks = [min(scaled_costs) + m*r for m in range(6)]
            ax3.set_yticks(marks)
            labels = [item.get_text() for item in ax3.get_yticklabels()]
            
            r = (max(cost_evals) - min(cost_evals))/5.0
            marks = [int(min(cost_evals) + m*r) for m in range(6)]
            ax3.set_yticklabels(marks)

    
    ###### plot plotting functions ######
    def plot_data(self,**kwargs):
        # construct figure
        fig, axs = plt.subplots(1, 3, figsize=(8,3))

        # create subplot with 2 panels
        gs = gridspec.GridSpec(1, 3, width_ratios=[1,2,1]) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off') 
        ax2 = plt.subplot(gs[1]); 
        ax3 = plt.subplot(gs[2]); ax3.axis('off')
        
        if np.shape(self.x)[1] == 2:
            ax2 = plt.subplot(gs[1],projection='3d'); 

        # scatter points
        self.scatter_pts(ax2,self.x)
        
        # label axes
        if 'xlabel' in kwargs:
            xlabel = kwargs['xlabel']
            ylabel = kwargs['ylabel']
            rotation = 0
            if len(ylabel) > 1:
                rotation = 90
            ax2.set_xlabel(xlabel,fontsize = 12)
            ax2.set_ylabel(ylabel,fontsize = 12,rotation = rotation)

    # scatter points
    def scatter_pts(self,ax,x):
        if np.shape(x)[1] == 1:
            # set plotting limits
            xmax = copy.deepcopy(max(x))
            xmin = copy.deepcopy(min(x))
            xgap = (xmax - xmin)*0.2
            xmin -= xgap
            xmax += xgap
            
            ymax = max(self.y)
            ymin = min(self.y)
            ygap = (ymax - ymin)*0.2
            ymin -= ygap
            ymax += ygap    

            # initialize points
            ax.scatter(x,self.y,color = 'k', edgecolor = 'w',linewidth = 0.9,s = 40)

            # clean up panel
            ax.set_xlim([xmin,xmax])
            ax.set_ylim([ymin,ymax])
            
        if np.shape(x)[1] == 2:
            # set plotting limits
            xmax1 = copy.deepcopy(max(x[:,0]))
            xmin1 = copy.deepcopy(min(x[:,0]))
            xgap1 = (xmax1 - xmin1)*0.1
            xmin1 -= xgap1
            xmax1 += xgap1
            
            xmax2 = copy.deepcopy(max(x[:,1]))
            xmin2 = copy.deepcopy(min(x[:,1]))
            xgap2 = (xmax2 - xmin2)*0.1
            xmin2 -= xgap2
            xmax2 += xgap2
            
            ymax = max(self.y)
            ymin = min(self.y)
            ygap = (ymax - ymin)*0.2
            ymin -= ygap
            ymax += ygap    

            # initialize points
            ax.scatter(x[:,0],x[:,1],self.y,s = 40,color = 'k', edgecolor = 'w',linewidth = 0.9)

            # clean up panel
            ax.set_xlim([xmin1,xmax1])
            ax.set_ylim([xmin2,xmax2])
            ax.set_zlim([ymin,ymax])
            
            #r = (round(xmax1) - round(xmin1))/5.0
            #marks = [min(rx1) + m*r for m in range(6)]
            #ax.set_xticks(marks)
            #ax.set_yticks(np.arange(round(xmin2), round(xmax2)+1, 1.0))
            #ax.set_zticks(np.arange(round(ymin), round(ymax)+1, 1.0))
           
            # clean up panel
            ax.xaxis.pane.fill = False
            ax.yaxis.pane.fill = False
            ax.zaxis.pane.fill = False

            ax.xaxis.pane.set_edgecolor('white')
            ax.yaxis.pane.set_edgecolor('white')
            ax.zaxis.pane.set_edgecolor('white')

            ax.xaxis._axinfo["grid"]['color'] =  (1,1,1,0)
            ax.yaxis._axinfo["grid"]['color'] =  (1,1,1,0)
            ax.zaxis._axinfo["grid"]['color'] =  (1,1,1,0)
           
    # set axis in left panel
    def move_axis_left(self,ax):
        tmp_planes = ax.zaxis._PLANES 
        ax.zaxis._PLANES = ( tmp_planes[2], tmp_planes[3], 
                             tmp_planes[0], tmp_planes[1], 
                             tmp_planes[4], tmp_planes[5])
        view_1 = (25, -135)
        view_2 = (25, -45)
        init_view = view_2
        ax.view_init(*init_view) 