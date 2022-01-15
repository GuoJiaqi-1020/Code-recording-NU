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
        
        # if 1-d regression data make sure points are sorted
        if np.shape(self.x)[1] == 1:
            ind = np.argsort(self.x.flatten())
            self.x = self.x[ind,:]
            self.y = self.y[ind,:]
            
    ########## show boosting results on 1d regression, with fit to residual ##########
    def animate_trees(self,tree,**kwargs):            
        # construct figure
        fig = plt.figure(figsize=(3.5,3.5))
        artist = fig

        # create subplot with 2 active panels
        gs = gridspec.GridSpec(1, 1) 
        ax = plt.subplot(gs[0]); 
        ax.axis('off')
        
        # set plotting limits
        xmax = np.max(copy.deepcopy(self.x))
        xmin = np.min(copy.deepcopy(self.x))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap

        ymax = np.max(copy.deepcopy(self.y))
        ymin = np.min(copy.deepcopy(self.y))
        ygap = (ymax - ymin)*0.1
        ymin -= ygap
        ymax += ygap    
 
        # start animation
        num_frames = tree.depth + 1
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
            
            # scatter data
            ax.scatter(self.x.flatten(),self.y.flatten(),color = 'k',s = 80,edgecolor = 'w',linewidth = 0.9,zorder = 3)
            
            # label axes
            ax.set_xlabel(r'$x$', fontsize = 14)
            ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 15)
            ax.axis('off')

            ### clean up panels ###             
            ax.set_xlim([xmin,xmax])
            ax.set_ylim([ymin,ymax])
            
            if k == 0:
                ax.set_title('a',fontsize = 14,alpha=0)
        
            if k > 0:
                # pluck out current weights 
                self.draw_fit(ax,tree,k-1)
                ax.set_title('tree depth = ' + str(k),fontsize = 14)

            return artist,

        anim = animation.FuncAnimation(fig, animate ,frames=num_frames, interval=num_frames, blit=True)
        
        return(anim)

    # 1d regression demo
    def draw_fit(self,ax,run,ind):
        # set plotting limits
        xmax = np.max(copy.deepcopy(self.x))
        xmin = np.min(copy.deepcopy(self.x))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap

        ymax = np.max(copy.deepcopy(self.y))
        ymin = np.min(copy.deepcopy(self.y))
        ygap = (ymax - ymin)*0.1
        ymin -= ygap
        ymax += ygap    

        ####### plot total model on original dataset #######        
        # plot fit on residual
        s = np.linspace(xmin,xmax,2000)
        t = []
        for val in s:
            val = np.array([val])[np.newaxis,:]
            out = run.evaluate_tree(val,ind)
            t.append(out)

        ax.plot(s,t,linewidth = 4,c = 'k',zorder = 1)
        ax.plot(s,t,linewidth = 2,c = [1,0,0.4],zorder = 1)
       