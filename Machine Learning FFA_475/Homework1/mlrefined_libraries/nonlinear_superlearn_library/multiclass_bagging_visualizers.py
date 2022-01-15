# Import plotting libraries
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec

# import autograd functionality
import autograd.numpy as np
from scipy import stats

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
            
    ########## show boosting crossval on 1d regression, with fit to residual ##########
    def show_runs(self,best_runs,**kwargs):
        ### setup figure and plotting grid ###
        fig = plt.figure(1,figsize = (9,8))
        gridspec.GridSpec(6,5,wspace=0.0, hspace=0.0)
        
        # create tuples for mapping plots to axes
        blocks = []
        for i in range(5):
            for j in range(2):
                blocks.append(tuple((i,j)))

         ### plot individual best models in small subplots ###
        all_fits = []
        self.univ_ind = 0
        for k in range(len(best_runs)):
            # select axis for individual plot
            run = best_runs[k]
            ax = plt.subplot2grid((6,5), blocks[k])
            #ax.axis('equal')

            # pluck out current weights           
            self.draw_fit_trainval(ax,run)
            
            # turn off ticks and labels
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)

            self.univ_ind += 1
            ax.axis('equal')

        # plot all models and ave
        ax = plt.subplot2grid((6,5), (1,2), colspan=4, rowspan=3)
                
        # plot all models and ave
        self.draw_models(ax,best_runs)
        ax.axis('equal')

            
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
   
        ####### plot total model on original dataset #######
        C = len(np.unique(self.y))
        
        # plot data  
        for c in range(C):
            # plot points
            ind0 = np.argwhere(self.y == c)
            ind0 = [v[1] for v in ind0]
            ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45,color = self.colors[c], edgecolor ='k',linewidth = 1,zorder = 3)     
               
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

            # evaluate model and go
            z1 = model(normalizer(h.T),w)
            z1 = np.asarray(z1)
            z1 = np.argmax(z1,axis = 0)
            
            # reshape it
            z1.shape = (np.size(s1),np.size(s2))     
            t_ave.append(z1)
        
        # take average model
        t_ave = np.array(t_ave)
        z_final = np.zeros((t_ave.shape[1],t_ave.shape[2]))
        for i in range(z_final.shape[0]):
            for j in range(z_final.shape[1]):
                common_val = stats.mode(t_ave[:,i,j],axis = None)
                z_final[i,j] = common_val.mode[0]

        ax.contour(a,b,z_final,colors = 'k',levels = range(0,C+1),linewidths = 3.5,zorder = 5)

        ### clean up panels ###             
        ax.set_xlim([xmin1,xmax1])
        ax.set_ylim([xmin2,xmax2])
 
        # label axes
        ax.set_xlabel(r'$x_1$', fontsize = 14)
        ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)
            
    def draw_fit_trainval(self,ax,run):
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
        C = len(np.unique(self.y))
        
        # scatter original data - training and validation sets
        train_inds = run.train_inds
        valid_inds = run.valid_inds

        x_train = self.x[:,train_inds]
        y_train = self.y[:,train_inds]
        x_valid = self.x[:,valid_inds]
        y_valid = self.y[:,valid_inds]
        
        # plot data  
        for c in range(C):
            # plot points
            ind0 = np.argwhere(y_train == c)
            ind0 = [v[1] for v in ind0]
            ax.scatter(x_train[0,ind0],x_train[1,ind0],s = 10,color = self.colors[c], edgecolor ='k',linewidth = 1,zorder = 3)     
                
            ind0 = np.argwhere(y_valid == c)
            ind0 = [v[1] for v in ind0]
            ax.scatter(x_valid[0,ind0],x_valid[1,ind0],s = 10, color = self.colors[c],edgecolor = [1,0.8,0.5],linewidth = 1,zorder = 3)
 
        # model basics
        cost = run.cost
        model = run.model
        feat = run.feature_transforms
        normalizer = run.normalizer
        w = run.weight_histories
        
        # plot boundary for 2d plot
        s1 = np.linspace(xmin1,xmax1,400)
        s2 = np.linspace(xmin2,xmax2,400)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))     
        b.shape = (np.size(s1),np.size(s2))  

        # evaluate model and go
        z1 = model(normalizer(h.T),w)
        z1 = np.asarray(z1)
        z1 = np.argmax(z1,axis = 0)
        z1.shape = (np.size(s1),np.size(s2))     
              
        # plot separator in right plot
        ax.contour(a,b,z1,colors = 'k',levels = range(0,C+1),linewidths = 2.5,zorder = 5)
        ax.contour(a,b,z1,colors = self.plot_colors[self.univ_ind],levels = range(0,C+1),linewidths = 1.5,zorder = 5)
            
        ### clean up panels ###             
        ax.set_xlim([xmin1,xmax1])
        ax.set_ylim([xmin2,xmax2])
        
    def show_baggs(self,runs):
        fig, axs = plt.subplots(figsize=(9,3),ncols = 3)
        
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
        ax = axs[1]; 
        ax1 = axs[2]; 
        ax_orig = axs[0];

        
        # plot data  
        C = len(np.unique(self.y))
        for c in range(C):
            # plot points
            ind0 = np.argwhere(self.y == c)
            ind0 = [v[1] for v in ind0]
            ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45,color = self.colors[c], edgecolor ='k',linewidth = 1,zorder = 3)     
            ax1.scatter(self.x[0,ind0],self.x[1,ind0],s = 45,color = self.colors[c], edgecolor ='k',linewidth = 1,zorder = 3)     
            ax_orig.scatter(self.x[0,ind0],self.x[1,ind0],s = 45,color = self.colors[c], edgecolor ='k',linewidth = 1,zorder = 3)     

        ### clean up panels ###             
        ax.set_xlim([xmin1,xmax1])
        ax1.set_xlim([xmin1,xmax1])
        ax_orig.set_xlim([xmin1,xmax1])

        ax.set_ylim([xmin2,xmax2])
        ax1.set_ylim([xmin2,xmax2])
        ax_orig.set_ylim([xmin2,xmax2])
        
        # turn off ticks and labels
        plt.setp(ax.get_yticklabels(), visible=False)
        ax.yaxis.set_tick_params(size=0)
        ax.yaxis.tick_left()
        plt.setp(ax.get_xticklabels(), visible=False)
        ax.xaxis.set_tick_params(size=0)
        
        plt.setp(ax1.get_yticklabels(), visible=False)
        ax1.yaxis.set_tick_params(size=0)
        ax1.yaxis.tick_left()
        plt.setp(ax1.get_xticklabels(), visible=False)
        ax1.xaxis.set_tick_params(size=0)
        
        plt.setp(ax_orig.get_yticklabels(), visible=False)
        ax_orig.yaxis.set_tick_params(size=0)
        ax_orig.yaxis.tick_left()
        plt.setp(ax_orig.get_xticklabels(), visible=False)
        ax_orig.xaxis.set_tick_params(size=0)

        # label axes
        '''
        ax.set_xlabel(r'$x_1$', fontsize = 14)
        ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 0)
        ax1.set_xlabel(r'$x_1$', fontsize = 14)
        ax1.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 0)       
        ax_orig.set_xlabel(r'$x_1$', fontsize = 14)
        ax_orig.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 0)       
        '''
        
        ax.set_title('individual models')
        ax1.set_title('modal model')
        ax_orig.set_title('data')

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
        t_ave = []
        for k in range(len(runs)):
            # get current run
            run = runs[k]
            cost = run.cost
            model = run.model
            feat = run.feature_transforms
            normalizer = run.normalizer
            w = run.weight_histories
            
            # evaluate model and go
            z1 = model(normalizer(h.T),w)
            z1 = np.asarray(z1)
            z1 = np.argmax(z1,axis = 0)
            z1.shape = (np.size(s1),np.size(s2))     

            # plot separator in right plot
            ax.contour(a,b,z1,colors = 'k',levels = range(0,C+1),linewidths = 2.5,zorder = 5)
            ax.contour(a,b,z1,colors = self.plot_colors[k],levels = range(0,C+1),linewidths = 1.5,zorder = 5)

            t_ave.append(z1)
        
        # take average model
        t_ave = np.array(t_ave)
        z_final = np.zeros((t_ave.shape[1],t_ave.shape[2]))
        for i in range(z_final.shape[0]):
            for j in range(z_final.shape[1]):
                common_val = stats.mode(t_ave[:,i,j],axis = None)
                z_final[i,j] = common_val.mode[0]

        ax1.contour(a,b,z_final,colors = 'k',levels = range(0,C+1),linewidths = 3.5,zorder = 5)
        
