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
            
    #### animate multiple runs on single regression ####
    def animate_trainval_regularization(self,runs,frames,num_units,**kwargs):    
        pt_size = 55
        if 'pt_size' in kwargs:
            pt_size = kwargs['pt_size']
            
       # get training / validation errors
        train_errors = []
        valid_errors = []
        for run in runs:
            # get histories
            train_costs = run.train_count_histories[0]
            valid_costs = run.valid_count_histories[0]
            weights = run.weight_histories[0]
            
            # select based on minimum training
            ind = np.argmin(train_costs)
            train_cost = train_costs[ind]
            valid_cost = valid_costs[ind]
            weight = weights[ind]
            
            # store
            train_errors.append(train_cost)
            valid_errors.append(valid_cost)
            
        # select subset of runs
        inds = np.arange(0,len(runs),int(len(runs)/float(frames)))
        train_errors = [train_errors[v] for v in inds]
        valid_errors = [valid_errors[v] for v in inds]
        labels = []
        for f in range(frames):
            run = runs[inds[f]]
            labels.append(np.round(run.lam,2))
          
        #labels = list(reversed(labels))
        
        # select inds of history to plot
        num_runs = frames

        # construct figure
        fig = plt.figure(figsize=(9,4))
        artist = fig
                
        # create subplot with 2 active panels
        gs = gridspec.GridSpec(1, 2, width_ratios=[1,1]) 
        ax = plt.subplot(gs[0]); ax.axis('equal'); ax.axis('off')
        ax1 = plt.subplot(gs[1]); 
                
        # global names for train / valid sets
        train_inds = runs[0].train_inds
        valid_inds = runs[0].valid_inds
        
        self.x_train = self.x[:,train_inds]
        self.y_train = self.y[:,train_inds]
        
        self.x_valid = self.x[:,valid_inds]
        self.y_valid = self.y[:,valid_inds]
        
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
        num_frames = num_runs + 1
        print ('starting animation rendering...')
        def animate(k):
            # clear panels
            ax.cla()
            ax1.cla()
            ax.axis('off')
            
            # print rendering update
            if np.mod(k+1,25) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(num_frames))
            if k == num_frames - 1:
                print ('animation rendering complete!')
                time.sleep(1.5)
                clear_output()
           
            #### scatter data ####
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
            
            # plot boundary and errors
            if k > 0:
                # get current run for cost function history plot
                a = inds[k-1]
                run = runs[a]
           
                # plot boundary
                self.draw_boundary(ax,run,a)
                
                # show cost function history
                self.plot_train_valid_errors(ax1,k-1,train_errors,valid_errors,labels)
                                
            # cleanup
            ax1.set_xlabel(r'$\lambda$',fontsize = 12)
            ax1.set_title('number of misclassifications',fontsize = 15)

            # cleanp panel                
            num_iterations = len(train_errors)
            minxc = -0.01
            maxxc = max(labels) + 0.01
            minc = min(min(copy.deepcopy(train_errors)),min(copy.deepcopy(valid_errors)))
            maxc = max(max(copy.deepcopy(train_errors)),max(copy.deepcopy(valid_errors)))

            gapc = (maxc - minc)*0.1
            #minc -= gapc
            maxc += gapc

            ax1.set_xlim([minxc,maxxc])
            ax1.set_ylim([minc,maxc])
            ax1.invert_xaxis()

            return artist,

        anim = animation.FuncAnimation(fig, animate ,frames=num_frames, interval=num_frames, blit=True)
        
        return(anim)

    ##### draw boundary #####
    def draw_boundary(self,ax,run,ind):
        ### create boundary data ###
        # get visual boundary
        xmin1 = np.min(self.x[0,:])
        xmax1 = np.max(self.x[0,:])
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = np.min(self.x[1,:])
        xmax2 = np.max(self.x[1,:])
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2    
        
        # plot boundary for 2d plot
        r1 = np.linspace(xmin1,xmax1,300)
        r2 = np.linspace(xmin2,xmax2,300)
        s,t = np.meshgrid(r1,r2)
        s = np.reshape(s,(np.size(s),1))
        t = np.reshape(t,(np.size(t),1))
        h = np.concatenate((s,t),axis = 1).T
        
        # get current run
        cost = run.cost
        model = run.model
        feat = run.feature_transforms
        normalizer = run.normalizer
        cost_history = run.train_count_histories[0]
        weight_history = run.weight_histories[0]

        # get best weights                
        win = np.argmin(cost_history)
        w = weight_history[win]        
        z = model(normalizer(h),w)
        z1 = np.sign(z)        

        # reshape it
        s.shape = (np.size(r1),np.size(r2))
        t.shape = (np.size(r1),np.size(r2))     
        z1.shape = (np.size(r1),np.size(r2))
        
        #### plot contour, color regions ####
        ax.contour(s,t,z1,colors='k', linewidths=2.5,levels = [0],zorder = 2)
        ax.contourf(s,t,z1,colors = [self.colors[1],self.colors[0]],alpha = 0.15,levels = range(-1,2))
        
    def plot_train_valid_errors(self,ax,k,train_errors,valid_errors,labels):      
        ax.plot(labels[:k+1] ,train_errors[:k+1],color = [0,0.7,1],linewidth = 2.5,zorder = 1,label = 'training')
        #ax.scatter(labels[:k+1],train_errors[:k+1],color = [0,0.7,1],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)

        ax.plot(labels[:k+1] ,valid_errors[:k+1],color = [1,0.8,0.5],linewidth = 2.5,zorder = 1,label = 'validation')
        #ax.scatter(labels[:k+1] ,valid_errors[:k+1],color= [1,0.8,0.5],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)



        