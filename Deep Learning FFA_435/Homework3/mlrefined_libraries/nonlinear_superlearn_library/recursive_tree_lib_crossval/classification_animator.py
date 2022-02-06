# import standard plotting and animation
import matplotlib.pyplot as plt
from matplotlib import gridspec
from matplotlib.ticker import FormatStrFormatter
import matplotlib.animation as animation
from mlrefined_libraries.JSAnimation_slider_only import IPython_display_slider_only
from mpl_toolkits.mplot3d import Axes3D
from IPython.display import clear_output

# import autograd functionality
import autograd.numpy as np

# import standard libraries
import math
import time
import copy
from inspect import signature

class Visualizer:
    '''
    Visualize linear regression in 2 and 3 dimensions.  For single input cases (2 dimensions) the path of gradient descent on the cost function can be animated.
    '''
    #### initialize ####
    def __init__(self,csvname):
        # grab input
        data = np.loadtxt(csvname,delimiter = ',')
        self.x = data[:-1,:]
        self.y = data[-1:,:] 

        self.colors = [[1,0.8,0.5],[0,0.7,1]]
        self.colors = ['cornflowerblue','salmon']
        
        self.plot_colors = ['lime','violet','orange','b','r','darkorange','lightcoral','chartreuse','aqua','deeppink']
            
    ########## show boosting results on 1d regression, with fit to residual ##########
    def animate_trees(self,tree,**kwargs):
        # extract train / valid inds and errors
        train_inds = tree.train_inds
        valid_inds = tree.valid_inds
        train_errors = tree.train_errors
        valid_errors = tree.valid_errors
        
        x_train = self.x[:,train_inds]
        y_train = self.y[:,train_inds]
        x_valid = self.x[:,valid_inds]
        y_valid = self.y[:,valid_inds]

        # construct figure
        fig = plt.figure(figsize=(8,3.5))
        artist = fig

        # create subplot with 2 active panels
        gs = gridspec.GridSpec(1, 3,width_ratios = [1,0.1,1]) 
        ax = plt.subplot(gs[0]); ax.axis('off');
        ax1 = plt.subplot(gs[1]); ax1.axis('off');
        ax2 = plt.subplot(gs[2]);
        
        # set plotting limits
        xmax1 = np.max(copy.deepcopy(self.x[0,:]))
        xmin1 = np.min(copy.deepcopy(self.x[0,:]))
        xgap1 = (xmax1 - xmin1)*0.1
        xmin1 -= xgap1
        xmax1 += xgap1
        
        xmax2 = np.max(copy.deepcopy(self.x[1,:]))
        xmin2 = np.min(copy.deepcopy(self.x[1,:]))
        xgap2 = (xmax2 - xmin2)*0.1
        xmin2 -= xgap2
        xmax2 += xgap2 
 
        # start animation
        num_frames = tree.depth + 1
        print ('starting animation rendering...')
        def animate(k):
            # clear panels
            ax.cla()
            
            # print rendering update
            if np.mod(k+1,25) == 0:
                print ('rendering animation frame ' + str(k) + ' of ' + str(num_frames))
            if k == num_frames - 1:
                print ('animation rendering complete!')
                time.sleep(1.5)
                clear_output()
            
            # scatter data
            vals = np.unique(self.y)
            count = 0

            # plot data  
            ind0 = np.argwhere(y_train == +1)
            ind0 = [v[1] for v in ind0]
            ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 60, color = self.colors[1],edgecolor = 'k',linewidth = 1,zorder = 3)

            ind0 = np.argwhere(y_valid == +1)
            ind0 = [v[1] for v in ind0]
            ax.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 60, color = self.colors[1],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)

            ind0 = np.argwhere(y_train == -1)
            ind0 = [v[1] for v in ind0]
            ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 60, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)

            ind0 = np.argwhere(y_valid == -1)
            ind0 = [v[1] for v in ind0]
            ax.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 60, color = self.colors[0],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)            
                

            # label axes
            ax.set_xlabel(r'$x_1$', fontsize = 14)
            ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)
            # ax.axis('off')

            ### clean up panels ###             
            ax.set_xlim([xmin1,xmax1])
            ax.set_ylim([xmin2,xmax2])
            
            if k == 0:
                ax.set_title('a',fontsize = 14,alpha=0)
        
            if k > 0:
                # pluck out current weights 
                color_it = True
                self.draw_fit(ax,tree,k-1,color_it)
                ax.set_title('tree depth = ' + str(k),fontsize = 14)
                
            # plot train / valid errors
            self.plot_train_valid_errors(ax2,k-1,train_errors,valid_errors)    
                
            return artist,

        anim = animation.FuncAnimation(fig, animate ,frames=num_frames, interval=num_frames, blit=True)
        
        return(anim)

    # plot train / valid errors
    def plot_train_valid_errors(self,ax,k,train_errors,valid_errors):
        num_elements = np.arange(len(train_errors))
        ax.plot([v+1 for v in num_elements[:k+1]] ,train_errors[:k+1],color = [0,0.7,1],linewidth = 1.5,zorder = 1,label = 'training')
        ax.scatter([v+1  for v in num_elements[:k+1]] ,train_errors[:k+1],color = [0,0.7,1],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)

        ax.plot([v+1  for v in num_elements[:k+1]] ,valid_errors[:k+1],color = [1,0.8,0.5],linewidth = 1.5,zorder = 1,label = 'validation')
        ax.scatter([v+1  for v in num_elements[:k+1]] ,valid_errors[:k+1],color= [1,0.8,0.5],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)
        ax.set_title('accuracy',fontsize = 15)

        # cleanup
        ax.set_xlabel('maximum depth',fontsize = 12)

        # cleanp panel                
        num_iterations = len(train_errors)
        minxc = 0.5
        maxxc = len(num_elements) + 0.5
        minc = min(min(copy.deepcopy(train_errors)),min(copy.deepcopy(valid_errors)))
        maxc = max(max(copy.deepcopy(train_errors[:5])),max(copy.deepcopy(valid_errors[:5])))
        gapc = (maxc - minc)*0.2
        minc -= gapc
        maxc += gapc
        
        ax.set_xlim([minxc,maxxc])
        ax.set_ylim([minc,maxc])
        
        #ax.xaxis.set_major_locator(MaxNLocator(integer=True))
        #labels = [str(v) for v in range(depth)]
        #nums = np.arange(1,len(num_elements)+1,int(len(num_elements)+1)/float(5))
        #ax.set_xticks(nums)
        #ax.set_xticklabels(depth)    
    
    # draw decision boundary
    def draw_fit(self,ax,tree,ind,color_it):
        # set plotting limits
        xmax1 = np.max(copy.deepcopy(self.x[0,:]))
        xmin1 = np.min(copy.deepcopy(self.x[0,:]))
        xgap1 = (xmax1 - xmin1)*0.1
        xmin1 -= xgap1
        xmax1 += xgap1
        
        xmax2 = np.max(copy.deepcopy(self.x[1,:]))
        xmin2 = np.min(copy.deepcopy(self.x[1,:]))
        xgap2 = (xmax2 - xmin2)*0.1
        xmin2 -= xgap2
        xmax2 += xgap2 
 
        # plot boundary for 2d plot
        r1 = np.linspace(xmin1,xmax1,100)
        r2 = np.linspace(xmin2,xmax2,100)
        s,t = np.meshgrid(r1,r2)
        s = np.reshape(s,(np.size(s),1))
        t = np.reshape(t,(np.size(t),1))
        h = np.concatenate((s,t),axis = 1)
        
        a = []
        for val in h:
            val = val[:,np.newaxis]
            out = tree.evaluate_tree(val,ind)
            a.append(out)    
        a = np.array(a)    

        # compute model on train data
        #z1 = np.sign(a)
        z1 = a
        C = len(np.unique(z1))

        # reshape it
        s.shape = (np.size(r1),np.size(r2))
        t.shape = (np.size(r1),np.size(r2))     
        z1.shape = (np.size(r1),np.size(r2))
        
        #### plot contour, color regions ####
        ax.contour(s,t,z1,colors='k', linewidths=2.5,levels = range(C-1),zorder = 2)
        if color_it == True:
            ax.contourf(s,t,z1,colors = [self.colors[e] for e in range(C)],alpha = 0.15,levels = range(-1,C))


        #for s in range(ind):
            