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
        
        self.colors = ['salmon','cornflowerblue','lime','bisque','mediumaquamarine','b','m','g']
        self.plot_colors = ['lime','violet','orange','b']
        
        '''
        # if 1-d regression data make sure points are sorted
        if np.shape(self.x)[1] == 1:
            ind = np.argsort(self.x.flatten())
            self.x = self.x[ind,:]
            self.y = self.y[ind,:]
        '''
            
    ########## show boosting crossval on 1d regression, with fit to residual ##########
    def show_runs(self,runs,**kwargs):
        # construct figure
        fig, axs = plt.subplots(figsize=(9,6),nrows=2,ncols = len(runs))

        # loop over runs and plot
        for k in range(len(runs)):
            # get current run for cost function history plot
            run = runs[k]

            # pluck out current weights 
            self.draw_fit_trainval(axs[0,k],run,self.plot_colors[k])
            
        for i in range(2,len(runs)):
            axs[1,i].axis('off')
            
        # run off all other axes labels
        axs[1,0].axis('off')
        
        # plot all models and ave
        self.draw_models(axs[1,1],runs)
            
    def draw_models(self,ax,runs):
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
        
        # plot data
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)

        ind1 = np.argwhere(self.y == -1)
        ind1 = [v[1] for v in ind1]
        ax.scatter(self.x[0,ind1],self.x[1,ind1],s = 45, color = self.colors[1], edgecolor = 'k',linewidth = 1,zorder = 3)
           
        ### clean up panels ###             
        ax.set_xlim([xmin1,xmax1])
        ax.set_ylim([xmin2,xmax2])
        
        # label axes
        ax.set_xlabel(r'$x_1$', fontsize = 14)
        ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)
        
        # plot boundary for 2d plot
        s1 = np.linspace(xmin1,xmax1,400)
        s2 = np.linspace(xmin2,xmax2,400)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))     
        b.shape = (np.size(s1),np.size(s2))     

        # plot fit on residual
        t_ave = []
        for k in range(len(runs)):
            # get current run
            run = runs[k]
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

            #### plot contour, color regions ####
            col = np.random.rand(1,3)
            ax.contour(s1,s2,t, linewidths=2.5,levels = [0],colors = self.plot_colors[k],zorder = 2,alpha = 0.4)

            t_ave.append(t)
        
        t_ave = np.array(t_ave)
        t_ave1 = np.median(t_ave,axis = 0)
        ax.contour(s1,s2,t_ave1, linewidths=2.5,levels = [0],colors = 'k',zorder = 4,alpha = 1)
            
    def draw_fit_trainval(self,ax,run,color):
        # get visual boundary
        xmin1 = np.min(copy.deepcopy(self.x[0,:]))
        xmax1 = np.max(copy.deepcopy(self.x[0,:]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = np.min(copy.deepcopy(self.x[1,:]))
        xmax2 = np.max(copy.deepcopy(self.x[1,:]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2  
       
        ####### plot total model on original dataset #######
        # scatter original data - training and validation sets
        train_inds = run.train_inds
        valid_inds = run.valid_inds
        x_train = run.x_train
        y_train = run.y_train
        x_val = run.x_valid
        y_val = run.y_valid
        
        # plot data  
        ind0 = np.argwhere(y_train == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[0],edgecolor = [0,0.7,1],linewidth = 1,zorder = 3)
        ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[0],edgecolor = [0,0.7,1],linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_val == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_val[0,ind0],x_val[1,ind0],s = 45, color = self.colors[0],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)
        ax.scatter(x_val[0,ind0],x_val[1,ind0],s = 45, color = self.colors[0],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_train == -1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[1],edgecolor = [0,0.7,1],linewidth = 1,zorder = 3)
        ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 45, color = self.colors[1],edgecolor = [0,0.7,1],linewidth = 1,zorder = 3)
        
        ind0 = np.argwhere(y_val == -1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_val[0,ind0],x_val[1,ind0],s = 45, color = self.colors[1],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)
        ax.scatter(x_val[0,ind0],x_val[1,ind0],s = 45, color = self.colors[1],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)
        
        # plot boundary for 2d plot
        s1 = np.linspace(xmin1,xmax1,400)
        s2 = np.linspace(xmin2,xmax2,400)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))     
        b.shape = (np.size(s1),np.size(s2))  
        
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

        #### plot contour, color regions ####
        col = np.random.rand(1,3)
        ax.contour(s1,s2,t, linewidths=3.5,levels = [0],colors = 'k',zorder = 2,alpha = 0.2)
        ax.contour(s1,s2,t, linewidths=2.5,levels = [0],colors = color,zorder = 2,alpha = 0.4)
            
        ### clean up panels ###             
        ax.set_xlim([xmin1,xmax1])
        ax.set_ylim([xmin2,xmax2])
        
        # label axes
        ax.set_xlabel(r'$x_1$', fontsize = 14)
        ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)

    def show_baggs(self,runs):
        fig, axs = plt.subplots(figsize=(8,4),ncols = 2)
        
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
        ax = axs[0]
        ax1 = axs[1]
        
        # plot data
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)
        ax1.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)

        ind1 = np.argwhere(self.y == -1)
        ind1 = [v[1] for v in ind1]
        ax.scatter(self.x[0,ind1],self.x[1,ind1],s = 45, color = self.colors[1], edgecolor = 'k',linewidth = 1,zorder = 3)
        ax1.scatter(self.x[0,ind1],self.x[1,ind1],s = 45, color = self.colors[1], edgecolor = 'k',linewidth = 1,zorder = 3)
           
        ### clean up panels ###             
        ax.set_xlim([xmin1,xmax1])
        ax1.set_xlim([xmin1,xmax1])

        ax.set_ylim([xmin2,xmax2])
        ax1.set_ylim([xmin2,xmax2])
        
        # label axes
        ax.set_xlabel(r'$x_1$', fontsize = 14)
        ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)
        ax1.set_xlabel(r'$x_1$', fontsize = 14)
        ax1.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)       
        
        ax.set_title('original / individual models')
        ax1.set_title('median model')
        
        # plot boundary for 2d plot
        s1 = np.linspace(xmin1,xmax1,400)
        s2 = np.linspace(xmin2,xmax2,400)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))     
        b.shape = (np.size(s1),np.size(s2))     

        # plot fit on residual
        t_ave = []
        for k in range(len(runs)):
            # get current run
            run = runs[k]
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

            #### plot contour, color regions ####
            col = np.random.rand(1,3)
            ax.contour(s1,s2,t, linewidths=2.5,levels = [0],colors = col,zorder = 2,alpha = 0.4)
            #ax1.contour(s1,s2,t, linewidths=2.5,levels = [0],colors = col,zorder = 2,alpha = 0.4)

            t_ave.append(t)
        
        t_ave = np.array(t_ave)
        t_ave1 = np.median(t_ave,axis = 0)
        ax1.contour(s1,s2,t_ave1, linewidths=2.5,levels = [0],colors = 'k',zorder = 4,alpha = 1)