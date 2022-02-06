# Import plotting libraries
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

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
        self.plot_colors = [[1,0,0.4], [ 0, 0.4, 1],[0, 1, 0.5],[1, 0.7, 0.5],[0.7, 0.6, 0.5],'mediumaquamarine']
        
        # if 1-d regression data make sure points are sorted
        if np.shape(self.x)[1] == 1:
            ind = np.argsort(self.x.flatten())
            self.x = self.x[ind,:]
            self.y = self.y[ind,:]

    # compare mean and median model
    def show_baggs(self,kernel_models,network_models,stump_models):
        fig, axs = plt.subplots(figsize=(10,2.5),ncols = 4)
        
        # set plotting limits
        xmax = np.max(copy.deepcopy(self.x))
        xmin = np.min(copy.deepcopy(self.x))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap

        ymax = np.max(copy.deepcopy(self.y))
        ymin = np.min(copy.deepcopy(self.y))
        ygap = (ymax - ymin)*0.25
        ymin -= ygap
        ymax += ygap    

        # setup panels
        ax1 = axs[0]
        ax1.set_xlim([xmin,xmax])
        ax1.set_ylim([ymin,ymax])        
        ax1.set_title('kernel model')
        
        ax2 = axs[1]
        ax2.set_xlim([xmin,xmax])
        ax2.set_ylim([ymin,ymax])        
        ax2.set_title('network model')
        
        ax3 = axs[2]
        ax3.set_xlim([xmin,xmax])
        ax3.set_ylim([ymin,ymax])
        ax3.set_title('stump model')

        ax4 = axs[3]
        ax4.set_xlim([xmin,xmax])
        ax4.set_ylim([ymin,ymax])
        ax4.set_title('median model')
        
        # turn off ticks and labels
        for ax in [ax1,ax2,ax3,ax4]:
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)

        # plot fit on residual
        s = np.linspace(xmin,xmax,2000)[np.newaxis,:]
        
        # plot fit on residual
        t_ave = []

        ### plot kernel run ###
        train_inds = kernel_models[0].train_inds
        valid_inds = kernel_models[0].valid_inds
        ax1.scatter(self.x[:,train_inds],self.y[:,train_inds],color = self.colors[1],s = 40,edgecolor = 'k',linewidth = 0.9)
        ax1.scatter(self.x[:,valid_inds],self.y[:,valid_inds],color = self.colors[0],s = 40,edgecolor = 'k',linewidth = 0.9)
        
        for kernel_run in kernel_models:
            model = kernel_run.model
            normalizer = kernel_run.normalizer
            w = kernel_run.weight_histories[0][1]

            # get best weights                
            t = model(normalizer(s),w)
            ax1.plot(s.T,t.T,linewidth = 3,alpha = 1,color = self.plot_colors[0])
            t_ave.append(t)
            
        ### get network run ###
        train_inds = network_models[0].train_inds
        valid_inds = network_models[0].valid_inds
        ax2.scatter(self.x[:,train_inds],self.y[:,train_inds],color = self.colors[1],s = 40,edgecolor = 'k',linewidth = 0.9)
        ax2.scatter(self.x[:,valid_inds],self.y[:,valid_inds],color = self.colors[0],s = 40,edgecolor = 'k',linewidth = 0.9)
        
        for network_run in network_models:
            model = network_run.model
            normalizer = network_run.normalizer
            valid_costs = network_run.valid_cost_histories
            best_ind = np.argmin(valid_costs)
            w = network_run.weight_histories[0][best_ind]

            # get best weights                
            t = model(normalizer(s),w)
            ax2.plot(s.T,t.T,linewidth = 3,alpha = 1,color = self.plot_colors[1])
            t_ave.append(t)
            
        ### get stump run ####
        train_inds = stump_models[0].train_inds
        valid_inds = stump_models[0].valid_inds
        ax3.scatter(self.x[:,train_inds],self.y[:,train_inds],color = self.colors[1],s = 40,edgecolor = 'k',linewidth = 0.9)
        ax3.scatter(self.x[:,valid_inds],self.y[:,valid_inds],color = self.colors[0],s = 40,edgecolor = 'k',linewidth = 0.9)
        
        for stump_run in stump_models:
            model = stump_run.model
            normalizer = stump_run.normalizer

            t = model(normalizer(s))
            ax3.plot(s.T,t.T,linewidth = 3,alpha = 1,color = self.plot_colors[2])
            t_ave.append(t)
           
        ### plot ave ###
        ax4.scatter(self.x,self.y,color = 'k',s = 50,edgecolor = 'w',linewidth = 0.9)        
        t_ave = np.array(t_ave)
        t_ave = np.swapaxes(t_ave,0,1)[0,:,:]
        t_ave2 = np.median(t_ave,axis = 0)

        # plot median model
        ax4.plot(s.T,t_ave2.T,linewidth = 4,c = 'k',alpha = 1)
        ax4.plot(s.T,t_ave2.T,linewidth = 3.5,c = 'r',alpha = 1)
        
    def draw_models(self,ax,all_models):
        # set plotting limits
        xmax = np.max(copy.deepcopy(self.x))
        xmin = np.min(copy.deepcopy(self.x))
        xgap = (xmax - xmin)*0.05
        xmin -= xgap
        xmax += xgap

        ymax = np.max(copy.deepcopy(self.y))
        ymin = np.min(copy.deepcopy(self.y))
        ygap = (ymax - ymin)*0.3
        ymin -= ygap
        ymax += ygap    

        ####### plot total model on original dataset #######
        # scatter original data - training and validation sets
        ax.scatter(self.x,self.y,color = 'k',s = 90,edgecolor = 'w',linewidth = 1.5)
        
        # plot fit on residual
        t_ave = []
        for k in range(len(all_models)):
            model = all_models[k]
            # plot current model
            s = model[0]
            t = model[1]
            #ax.plot(s.T,t.T,linewidth = 2,alpha = 0.4,c = self.plot_colors[k])
            t_ave.append(t)
        t_ave = np.array(t_ave)
        t_ave = np.swapaxes(t_ave,0,1)[0,:,:]
        t_ave1 = np.mean(t_ave,axis = 0)   
        t_ave2 = np.median(t_ave,axis = 0)   
        
        # plot ave model
        s = all_models[0][0]

        #ax.plot(s.T,t_ave1.T,linewidth = 4,c = 'k',alpha = 1)
        ax.plot(s.T,t_ave2.T,linewidth = 4,c = 'r',alpha = 1)

        ### clean up panels ###             
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])
        
        # label axes
        ax.set_xlabel(r'$x$', fontsize = 14)
        ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 5)
            
    def draw_fit_trainval(self,ax,run):
        # set plotting limits
        xmax = np.max(copy.deepcopy(self.x))
        xmin = np.min(copy.deepcopy(self.x))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap

        ymax = np.max(copy.deepcopy(self.y))
        ymin = np.min(copy.deepcopy(self.y))
        ygap = (ymax - ymin)*0.3
        ymin -= ygap
        ymax += ygap    

        ####### plot total model on original dataset #######
        # scatter original data - training and validation sets
        train_inds = run.train_inds
        valid_inds = run.valid_inds
        ax.scatter(self.x[:,train_inds],self.y[:,train_inds],color = self.colors[1],s = 12,edgecolor = 'k',linewidth = 0.9)
        ax.scatter(self.x[:,valid_inds],self.y[:,valid_inds],color = self.colors[0],s = 12,edgecolor = 'k',linewidth = 0.9)
        
        # plot fit on residual
        s = np.linspace(xmin,xmax,2000)[np.newaxis,:]

        # get current run
        model = run.model
        normalizer = run.normalizer
        w = run.weight_histories[0][1]

        # get best weights                
        t = model(normalizer(s),w)

        ax.plot(s.T,t.T,linewidth = 2,c = 'k',alpha = 0.4)
        ax.plot(s.T,t.T,linewidth = 1,alpha = 1,color = self.plot_colors[self.univ_ind])

        ### clean up panels ###             
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])
        
        # label axes
        #ax.axis('off')
        return s,t