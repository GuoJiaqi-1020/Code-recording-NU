# import standard plotting and animation
import matplotlib.pyplot as plt
from matplotlib import gridspec
from matplotlib.ticker import FormatStrFormatter
import matplotlib.animation as animation
from mlrefined_libraries.JSAnimation_slider_only import IPython_display_slider_only
from mpl_toolkits.mplot3d import Axes3D
from IPython.display import clear_output
from matplotlib.ticker import MaxNLocator, FuncFormatter

# import autograd functionality
import autograd.numpy as np
import math
import time
from matplotlib import gridspec
import copy
from matplotlib.ticker import FormatStrFormatter
from inspect import signature

class Visualizer:
    '''
    Visualize cross validation performed on N = 2 dimensional input classification datasets
    '''
    #### initialize ####
    def __init__(self,csvname):
        # grab input
        data = np.loadtxt(csvname,delimiter = ',')
        self.x = data[:-1,:]
        self.y = data[-1:,:] 

        self.colors = ['salmon','cornflowerblue','lime','bisque','mediumaquamarine','b','m','g']
        self.edge_colors = [[1,0.8,0.5],[0,0.7,1]]

    ########## show classification results ##########
    def animate_comparisons(self,runner,num_frames,**kwargs):
        pt_size = 55
        if 'pt_size' in kwargs:
            pt_size = kwargs['pt_size']
                        
        ### get inds for each run ###
        inds = np.arange(0,len(runner.models),int(len(runner.models)/float(num_frames)))
        
        # create subplot with 1 active panel
        # construct figure
        fig = plt.figure(figsize=(9,4))
        artist = fig
        gs = gridspec.GridSpec(1, 2) 
        ax = plt.subplot(gs[0]); 
        ax2 = plt.subplot(gs[1]); 
        
        ax.axis('off');
        ax.xaxis.set_visible(False) # Hide only x axis
        ax.yaxis.set_visible(False) # Hide only x axis
        
        # global names for train / valid sets
        train_inds = runner.train_inds
        valid_inds = runner.valid_inds
        
        self.x_train = self.x[:,train_inds]
        self.y_train = self.y[:,train_inds]
        
        self.x_valid = self.x[:,valid_inds]
        self.y_valid = self.y[:,valid_inds]
        
        self.normalizer = runner.normalizer
        train_errors = runner.train_count_vals
        valid_errors = runner.valid_count_vals
        num_units = len(runner.models)

        # viewing ranges
        xmin1 = min(copy.deepcopy(self.x[0,:]))
        xmax1 = max(copy.deepcopy(self.x[0,:]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = min(copy.deepcopy(self.x[1,:]))
        xmax2 = max(copy.deepcopy(self.x[1,:]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        # start animation
        print ('starting animation rendering...')
        def animate(k):
            # clear panels
            ax.cla()

            # print rendering update
            if np.mod(k+1,25) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(num_frames))
            if k == num_frames - 1:
                print ('animation rendering complete!')
                time.sleep(1.5)
                clear_output()
            
            # scatter training data
            ind0 = np.argwhere(self.y_train == +1)
            ind0 = [e[1] for e in ind0]
            ind1 = np.argwhere(self.y_train == -1)
            ind1 = [e[1] for e in ind1]
            ax.scatter(self.x_train[0,ind0],self.x_train[1,ind0],s = pt_size, color = self.colors[0], edgecolor = self.edge_colors[1],linewidth = 2,antialiased=True)
            ax.scatter(self.x_train[0,ind1],self.x_train[1,ind1],s = pt_size, color = self.colors[1], edgecolor = self.edge_colors[1],linewidth = 2,antialiased=True)
            
            
            ind0 = np.argwhere(self.y_valid == +1)
            ind0 = [e[1] for e in ind0]
            ind1 = np.argwhere(self.y_valid == -1)
            ind1 = [e[1] for e in ind1]
            ax.scatter(self.x_valid[0,ind0],self.x_valid[1,ind0],s = pt_size, color = self.colors[0], edgecolor = self.edge_colors[0],linewidth = 2,antialiased=True)
            ax.scatter(self.x_valid[0,ind1],self.x_valid[1,ind1],s = pt_size, color = self.colors[1], edgecolor = self.edge_colors[0],linewidth = 2,antialiased=True)
                
            ax.set_xlim([xmin1,xmax1])
            ax.set_ylim([xmin2,xmax2])
                
            # plot fit
            if k > 0:
                # get current run
                a = inds[k-1] 
                steps = runner.best_steps[:a+1]
                self.draw_boosting_fit(ax,steps,a)
                
                # plot train / valid errors up to this point
                self.plot_train_valid_errors(ax2,k-1,train_errors,valid_errors,inds)
                
            return artist,

        anim = animation.FuncAnimation(fig, animate ,frames=num_frames+1, interval=num_frames+1, blit=True)
        
        return(anim)
    
    

    ### draw boosting fit ###
    def draw_boosting_fit(self,ax,steps,ind):
        # viewing ranges
        xmin1 = min(copy.deepcopy(self.x[0,:]))
        xmax1 = max(copy.deepcopy(self.x[0,:]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = min(copy.deepcopy(self.x[1,:]))
        xmax2 = max(copy.deepcopy(self.x[1,:]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        ymin = min(copy.deepcopy(self.y))
        ymax = max(copy.deepcopy(self.y))
        ygap = (ymax - ymin)*0.05
        ymin -= ygap
        ymax += ygap

        # plot boundary for 2d plot
        r1 = np.linspace(xmin1,xmax1,30)
        r2 = np.linspace(xmin2,xmax2,30)
        s,t = np.meshgrid(r1,r2)
        s = np.reshape(s,(np.size(s),1))
        t = np.reshape(t,(np.size(t),1))
        h = np.concatenate((s,t),axis = 1).T

        model = lambda x: np.sum([v(x) for v in steps],axis=0)
        z = model(self.normalizer(h))
        z = np.sign(z)

        # reshape it
        s.shape = (np.size(r1),np.size(r2))
        t.shape = (np.size(r1),np.size(r2))     
        z.shape = (np.size(r1),np.size(r2))

        #### plot contour, color regions ####
        ax.contour(s,t,z,colors='k', linewidths=2.5,levels = [0],zorder = 2)
        ax.contourf(s,t,z,colors = [self.colors[1],self.colors[0]],alpha = 0.15,levels = range(-1,2))

        ### cleanup left plots, create max view ranges ###
        ax.set_xlim([xmin1,xmax1])
        ax.set_ylim([xmin2,xmax2])
        ax.set_title(str(ind+1) + ' units fit to data',fontsize = 14)
        
        
    # plot training / validation errors
    def plot_train_valid_errors(self,ax,k,train_errors,valid_errors,inds):
        num_elements = np.arange(len(train_errors))

        ax.plot([v+1 for v in inds[:k+1]] ,train_errors[:k+1],color = [0,0.7,1],linewidth = 2.5,zorder = 1,label = 'training')
        #ax.scatter([v+1  for v in inds[:k+1]] ,train_errors[:k+1],color = [0,0.7,1],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)

        ax.plot([v+1  for v in inds[:k+1]] ,valid_errors[:k+1],color = [1,0.8,0.5],linewidth = 2.5,zorder = 1,label = 'validation')
        #ax.scatter([v+1  for v in inds[:k+1]] ,valid_errors[:k+1],color= [1,0.8,0.5],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)
        ax.set_title('number of misclassifications',fontsize = 15)

        # cleanup
        ax.set_xlabel('number of units',fontsize = 12)

        # cleanp panel                
        num_iterations = len(train_errors)
        minxc = 0.5
        maxxc = len(num_elements) + 0.5
        minc = min(min(copy.deepcopy(train_errors)),min(copy.deepcopy(valid_errors)))
        maxc = max(max(copy.deepcopy(train_errors[:10])),max(copy.deepcopy(valid_errors[:10])))
        gapc = (maxc - minc)*0.05
        minc -= gapc
        maxc += gapc
        
        ax.set_xlim([minxc,maxxc])
        ax.set_ylim([minc,maxc])
        
        # ax.xaxis.set_major_locator(MaxNLocator(integer=True))
        #labels = [str(v) for v in num_units]
        #ax.set_xticks(np.arange(1,len(num_elements)+1))
       # ax.set_xticklabels(num_units)

        