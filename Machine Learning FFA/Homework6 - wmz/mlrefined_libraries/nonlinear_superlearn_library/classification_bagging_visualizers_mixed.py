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
        
        self.colors = ['salmon','cornflowerblue','lime','bisque','mediumaquamarine','b','m','g']
        self.edge_colors = [[1,0.8,0.5],[0,0.7,1]]

        self.plot_colors = ['lime','violet','orange','b','r','darkorange','lightcoral','chartreuse','aqua','deeppink']
            
    
    def show_baggs(self,kernel_models,network_models,stump_models):
        # produce figure
        fig, axs = plt.subplots(figsize=(10,3),ncols = 4)
        
        # set visual boundary
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
    
        # setup panels
        ax1 = axs[0]
        ax1.set_xlim([xmin1,xmax1])
        ax1.set_ylim([xmin2,xmax2])        
        ax1.set_title('kernel model')
        
        ax2 = axs[1]
        ax2.set_xlim([xmin1,xmax1])
        ax2.set_ylim([xmin2,xmax2])        
        ax2.set_title('network model')
        
        ax3 = axs[2]
        ax3.set_xlim([xmin1,xmax1])
        ax3.set_ylim([xmin2,xmax2])
        ax3.set_title('stump model')

        ax4 = axs[3]
        ax4.set_xlim([xmin1,xmax1])
        ax4.set_ylim([xmin2,xmax2])
        ax4.set_title('median model')
        
        # turn off ticks and labels
        for ax in [ax1,ax2,ax3,ax4]:
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)
        
        # setup region for plotting decision boundary
        s1 = np.linspace(xmin1,xmax1,500)
        s2 = np.linspace(xmin2,xmax2,500)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))     
        b.shape = (np.size(s1),np.size(s2))     

        # container for average model
        t_ave = []
        
        #### plot kernel model decision boundary ####
        # scatter train-val data
        self.scatter_trainval_data(kernel_models,ax1)

        # plot decision boundary
        for kernel_run in kernel_models:
            # extract tools from run
            model = kernel_run.model
            normalizer = kernel_run.normalizer
            w = kernel_run.weight_histories[0][1]
            
            # compute decision boundary
            o = model(normalizer(h.T),w)
            t = np.sign(o)             
            t.shape = (np.size(s1),np.size(s2))     

            # plot decision boundary
            ax1.contour(a,b,t, linewidths=2.5,levels = [0],colors = self.plot_colors[0],zorder = 5,alpha = 1.0)
            ax1.contour(a,b,t, linewidths=3.5,levels = [0],colors = 'k',zorder = 4,alpha = 1.0)

            t_ave.append(t)
     
    
        #### plot network model decision boundary ####
        # scatter train-val data
        self.scatter_trainval_data(network_models,ax2)

        # plot decision boundary
        for network_run in network_models:
            # extract tools from run
            model = network_run.model
            normalizer = network_run.normalizer
            ind = np.argmin(network_run.valid_count_histories[0])
            w = network_run.weight_histories[0][ind]
            
            # compute decision boundary
            o = model(normalizer(h.T),w)
            t = np.sign(o)             
            t.shape = (np.size(s1),np.size(s2))     

            # plot decision boundary
            ax2.contour(a,b,t, linewidths=2.5,levels = [0],colors = self.plot_colors[1],zorder = 5,alpha = 1.0)
            ax2.contour(a,b,t, linewidths=3.5,levels = [0],colors = 'k',zorder = 4,alpha = 1.0)

            t_ave.append(t)
         
    
        #### plot stump model decision boundary ####
        # scatter train-val data
        self.scatter_trainval_data(stump_models,ax3)
        
        # plot decision boundary
        for stump_run in stump_models:
            # extract utilities
            model = stump_run.model
            normalizer = stump_run.normalizer
            
            # compute decision boundary
            o = model(normalizer(h.T))
            t = np.sign(o)             
            t.shape = (np.size(s1),np.size(s2))     

            # plot decision boundary
            ax3.contour(a,b,t,linewidths=2.5,levels = [0],colors = self.plot_colors[2],zorder = 5,alpha = 1.0)
            ax3.contour(a,b,t, linewidths=3.5,levels = [0],colors = 'k',zorder = 4,alpha = 1.0)

            t_ave.append(t)
            
        # plot average decision boundary
        t_ave = np.array(t_ave)
        t_ave1 = np.median(t_ave,axis = 0)
        ax4.contour(a,b,t_ave1, linewidths=3.5,levels = [0],colors = 'k',zorder = 4,alpha = 1)
        self.scatter_data(ax4)
    
    # scatter original data
    def scatter_data(self,ax):
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(self.y == -1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[1],edgecolor = 'k',linewidth = 1,zorder = 3)
        
    # scatter train-validation data
    def scatter_trainval_data(self,model,ax):
        ### plot kernel run ###
        train_inds = model[0].train_inds
        valid_inds = model[0].valid_inds
        y_train = self.y[:,train_inds]
        x_train = self.x[:,train_inds]
        
        y_valid = self.y[:,valid_inds]
        x_valid = self.x[:,valid_inds]
        
        # plot training data in each panel
        ind0 = np.argwhere(y_train == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_train == -1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[1],edgecolor = 'k',linewidth = 1,zorder = 3)
        
        # plot validation data in each panel
        ind0 = np.argwhere(y_valid == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 45, color = self.colors[0],edgecolor = self.edge_colors[0],linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_valid == -1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 45, color = self.colors[1],edgecolor = self.edge_colors[0],linewidth = 1,zorder = 3)