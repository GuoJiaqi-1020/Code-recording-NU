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
                
        # if 1-d regression data make sure points are sorted
        if np.shape(self.x)[1] == 1:
            ind = np.argsort(self.x.flatten())
            self.x = self.x[ind,:]
            self.y = self.y[ind,:]
  
        cost_evals = [v/float(np.size(self.y)) for v in cost_evals]

    def cost_history_plot(self,ax,cost_evals,ind):
        # plot cost path - scale to fit inside same aspect as classification plots
        num_elements = len(cost_evals)
        minxc = 0.5
        maxxc = num_elements + 0.5

        ymax = max(copy.deepcopy(self.y))[0]
        ymin = min(copy.deepcopy(self.y))[0]
        ygap = (ymax - ymin)*0.1
        ymax += ygap
        ymin -= ygap
        
        # cost function value
        ax.plot(np.arange(1,num_elements + 1),cost_evals,color = 'k',linewidth = 2.5,zorder = 1)
        ax.scatter(num_elements[ind] + 1,cost_evals[ind],color = self.colors[0],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)

        ax.set_xlabel('number of units',fontsize = 12)
        ax.set_title('cost function plot',fontsize = 12)

        # cleanp panel
        ax.set_xlim([minxc,maxxc])
        ax.set_ylim([ymin,ymax])
              
    ########## show results on 1d regression ##########
    def animate_regressions(self,runs,frames,**kwargs):
        # select subset of runs
        inds = np.arange(0,len(runs),int(len(runs)/float(frames)))
        
        # pull out cost vals
        cost_evals = []
        for run in runs:
            # get current run histories
            cost_history = run.cost_histories[0]
            weight_history = run.weight_histories[0]

            # get best weights                
            win = np.argmin(cost_history)
            
            # get best cost val
            cost = cost_history[win]
            cost_evals.append(cost)
            
        # select inds of history to plot
        num_runs = frames

        # construct figure
        fig = plt.figure(figsize=(9,4))
        artist = fig

        # create subplot with 3 panels, plot input function in center plot
        gs = gridspec.GridSpec(1, 3, width_ratios=[2,1,0.25]) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off');
        ax2 = plt.subplot(gs[1]); ax2.axis('off');
        ax3 = plt.subplot(gs[2]); ax3.axis('off');
        
        # parse any input args
        scatter = 'none'
        if 'scatter' in kwargs:
            scatter = kwargs['scatter']

        # start animation
        num_frames = num_runs
        print ('starting animation rendering...')
        def animate(k):
            # clear panels
            ax1.cla()
            ax2.cla()
            
            # print rendering update
            if np.mod(k+1,25) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(num_frames))
            if k == num_frames - 1:
                print ('animation rendering complete!')
                time.sleep(1.5)
                clear_output()
            
            # scatter original data
            ax1.scatter(self.x.flatten(),self.y.flatten(),color = 'k',s = 40,edgecolor = 'w',linewidth = 0.9)
            
            if k > 0:
                # get current run for cost function history plot
                a = inds[k-1]
                run = runs[a]
                
                # pluck out current weights 
                self.draw_fit(ax1,run,a)
                
                # cost function history plot
                self.cost_history_plot(ax2,cost_evals,a)
                   
            return artist,

        anim = animation.FuncAnimation(fig, animate ,frames=num_frames+1, interval=num_frames+1, blit=True)
        
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

        # plot fit on residual
        s = np.linspace(xmin,xmax,2000)[np.newaxis,:]
           
        # plot total fit
        cost = run.cost
        model = run.model
        feat = run.feature_transforms
        normalizer = run.normalizer
        cost_history = run.cost_histories[0]
        weight_history = run.weight_histories[0]

        # get best weights                
        win = np.argmin(cost_history)
        w = weight_history[win]        
        t = model(normalizer(s),w)

        ax.plot(s.T,t.T,linewidth = 4,c = 'k')
        ax.plot(s.T,t.T,linewidth = 2,c = 'r')

        ### clean up panels ###             
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])
        
        # label axes
        ax.set_xlabel(r'$x$', fontsize = 14)
        ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 15)
        ax.set_title(str(ind+1) + ' units fit to data',fontsize = 14)
 
    ########## show results on 1d regression ##########
    def animate_boosting_regressions(self,run,frames,**kwargs):
        # select subset of runs
        inds = np.arange(0,len(run.models),int(len(run.models)/float(frames)))
            
        # select inds of history to plot
        num_runs = frames

        # construct figure
        fig = plt.figure(figsize=(9,4))
        artist = fig
        
        # parse any input args
        scatter = 'none'
        if 'scatter' in kwargs:
            scatter = kwargs['scatter']

        # create subplot with 1 active panel
        gs = gridspec.GridSpec(1, 3, width_ratios = [0.1,0.5,0.1]) 
        ax = plt.subplot(gs[1]); 

        # start animation
        num_frames = num_runs
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
            
            # scatter original data
            ax.scatter(self.x.flatten(),self.y.flatten(),color = 'k',s = 40,edgecolor = 'w',linewidth = 0.9)
            
            if k > 0:
                # get current run for cost function history plot
                a = inds[k-1]
                model = run.models[a]
                steps = run.best_steps[:a+1]
                
                # pluck out current weights 
                self.draw_boosting_fit(ax,steps,a)
            
            return artist,

        anim = animation.FuncAnimation(fig, animate ,frames=num_frames+1, interval=num_frames+1, blit=True)
        
        return(anim)
    
    # 1d regression demo
    def draw_boosting_fit(self,ax,steps,ind):
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

        # plot fit on residual
        s = np.linspace(xmin,xmax,2000)[np.newaxis,:]
           
        # get best weights          
        model = lambda x: np.sum([v(x) for v in steps],axis=0)
        t = model(s)
        ax.plot(s.T,t.T,linewidth = 4,c = 'k')
        ax.plot(s.T,t.T,linewidth = 2,c = 'r')

        ### clean up panels ###             
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])
        
        # label axes
        ax.set_xlabel(r'$x$', fontsize = 14)
        ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 15)
        ax.set_title(str(ind+1) + ' units fit to data',fontsize = 14)