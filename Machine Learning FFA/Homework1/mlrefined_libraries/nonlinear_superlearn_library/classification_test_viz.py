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
        self.plot_colors = ['lime','violet','orange','b','r','darkorange','lightcoral','chartreuse','aqua','deeppink']
            
    def show_baggs(self,runs,**kwargs):
        color_region = False
        if 'color_region' in kwargs:
            color_region = kwargs['color_region']
        
        fig, axs = plt.subplots(figsize=(8,3),ncols = 2)
        
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

        ####### plot total model on original dataset #######
        # scatter original data - training and validation sets
        ax1 = axs[0]
        ax2 = axs[1]
        
        # plot data
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        ax1.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)
        ax2.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)

        ind1 = np.argwhere(self.y == -1)
        ind1 = [v[1] for v in ind1]
        ax1.scatter(self.x[0,ind1],self.x[1,ind1],s = 45, color = self.colors[1], edgecolor = 'k',linewidth = 1,zorder = 3)
        ax2.scatter(self.x[0,ind1],self.x[1,ind1],s = 45, color = self.colors[1], edgecolor = 'k',linewidth = 1,zorder = 3)
          
        ### clean up panels ###             
        ax1.set_xlim([xmin1,xmax1])
        ax2.set_xlim([xmin1,xmax1])

        ax1.set_ylim([xmin2,xmax2])
        ax2.set_ylim([xmin2,xmax2])
        
        # turn off ticks and labels
        for ax in [ax1,ax2]:
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)
            
        ax1.set_title('data')
        ax2.set_title('cross-validated model')
        
        # plot boundary for 2d plot
        s1 = np.linspace(xmin1,xmax1,500)
        s2 = np.linspace(xmin2,xmax2,500)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))     
        b.shape = (np.size(s1),np.size(s2))     

        # plot fit on residual

        # get current run
        run = runs[0]
        cost = run.cost
        model = run.model
        feat = run.feature_transforms
        normalizer = run.normalizer
        w = run.weight_histories

        # get best weights                
        o = model(normalizer(h.T),w)
        t = np.sign(o) 

        # reshape it
        t.shape = (np.size(s1),np.size(s2))     
        ax2.contour(a,b,t, linewidths=3.5,levels = [0],colors = 'k',zorder = 4,alpha = 1)
        
        if color_region == True:
            ax2.contourf(a,b,t,colors = [self.colors[1],self.colors[0]],alpha = 0.2,levels = range(-1,2))

    def show_train_test(self,runs,x_test,y_test,**kwargs):
        color_region = False
        if 'color_region' in kwargs:
            color_region = kwargs['color_region']
        
        fig, axs = plt.subplots(figsize=(8,3),ncols = 2)
        
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
        
        ####### plot total model on original dataset #######
        # scatter original data - training and validation sets
        ax1 = axs[0]
        ax2 = axs[1]        
         
        ### clean up panels ###             
        ax1.set_xlim([xmin1,xmax1])
        ax2.set_xlim([xmin1,xmax1])

        ax1.set_ylim([xmin2,xmax2])
        ax2.set_ylim([xmin2,xmax2])
        
        # turn off ticks and labels
        for ax in [ax1,ax2]:
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)
            
        ax1.set_title('data')
        ax2.set_title('cross-validated model')
        
        # plot boundary for 2d plot
        s1 = np.linspace(xmin1,xmax1,500)
        s2 = np.linspace(xmin2,xmax2,500)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))     
        b.shape = (np.size(s1),np.size(s2))     

        # plot fit on residual

        # get current run
        run = runs[0]
        cost = run.cost
        model = run.model
        feat = run.feature_transforms
        normalizer = run.normalizer
        w = run.weight_histories

        # get best weights                
        o = model(normalizer(h.T),w)
        t = np.sign(o) 

        # reshape it
        t.shape = (np.size(s1),np.size(s2))     
        ax2.contour(a,b,t, linewidths=3.5,levels = [0],colors = 'k',zorder = 4,alpha = 1)
        
        if color_region == True:
            ax2.contourf(a,b,t,colors = [self.colors[1],self.colors[0]],alpha = 0.2,levels = range(-1,2))  
           
        #### scatter data ####
        # scatter original data - training and validation sets
        train_inds = run.train_inds
        valid_inds = run.valid_inds

        x_train = self.x[:,train_inds]
        y_train = self.y[:,train_inds]
        x_valid = self.x[:,valid_inds]
        y_valid = self.y[:,valid_inds]
        
        # plot training / validation data  
        ind0 = np.argwhere(y_train == +1)
        ind0 = [v[1] for v in ind0]
        ax1.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)
        ax2.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_valid == +1)
        ind0 = [v[1] for v in ind0]
        ax1.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 45, color = self.colors[0],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)
        ax2.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 45, color = self.colors[0],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_train == -1)
        ind0 = [v[1] for v in ind0]
        ax1.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[1],edgecolor = 'k',linewidth = 1,zorder = 3)
        ax2.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[1],edgecolor = 'k',linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_valid == -1)
        ind0 = [v[1] for v in ind0]
        ax1.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 45, color = self.colors[1],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)
        ax2.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 45, color = self.colors[1],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)

        # plot test data
        ind0 = np.argwhere(y_test == -1)
        ind0 = [v[1] for v in ind0]
        ax1.scatter(x_test[0,ind0],x_test[1,ind0],s = 45, color = self.colors[1],edgecolor = self.colors[2],linewidth = 1,zorder = 3)
        ax2.scatter(x_test[0,ind0],x_test[1,ind0],s = 45, color = self.colors[1],edgecolor = self.colors[2],linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_test == -1)
        ind0 = [v[1] for v in ind0]
        ax1.scatter(x_test[0,ind0],x_test[1,ind0],s = 45, color = self.colors[1],edgecolor = self.colors[2],linewidth = 1,zorder = 3)
        ax2.scatter(x_test[0,ind0],x_test[1,ind0],s = 45, color = self.colors[1],edgecolor = self.colors[2],linewidth = 1,zorder = 3)   
            
            