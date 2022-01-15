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
        self.plot_colors = [np.random.random(3) for i in range(20)]
        
        # if 1-d regression data make sure points are sorted
        if np.shape(self.x)[1] == 1:
            ind = np.argsort(self.x.flatten())
            self.x = self.x[ind,:]
            self.y = self.y[ind,:]
            
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

            # pluck out current weights 
            s,t = self.draw_fit_trainval(ax,run)
            
            # store fit
            all_fits.append([s,t])
            self.univ_ind += 1
            
            # turn off ticks and labels
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)
        
        # plot all models and ave
        ax = plt.subplot2grid((6,5), (1,2), colspan=4, rowspan=3)
        self.draw_models(ax,all_fits)
        
        # turn off ticks and labels
        plt.setp(ax.get_yticklabels(), visible=False)
        ax.yaxis.set_tick_params(size=0)
        ax.yaxis.tick_left()
        plt.setp(ax.get_xticklabels(), visible=False)
        ax.xaxis.set_tick_params(size=0)
        
        
        #fig.tight_layout()
        #plt.show()

    # compare mean and median model
    def show_baggs(self,runs):
        fig, axs = plt.subplots(figsize=(9,3),ncols = 3)
        
        # set plotting limits
        xmax = np.max(copy.deepcopy(self.x))
        xmin = np.min(copy.deepcopy(self.x))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap

        ymax = np.max(copy.deepcopy(self.y))
        ymin = np.min(copy.deepcopy(self.y))
        ygap = (ymax - ymin)*0.5
        ymin -= ygap
        ymax += ygap    

        ####### plot total model on original dataset #######
        # scatter original data - training and validation sets
        ax = axs[0]
        ax.scatter(self.x,self.y,color = 'k',s = 40,edgecolor = 'w',linewidth = 0.9,zorder = 1)
        
        ### clean up panels ###             
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])
        
        # label axes
        #ax.set_xlabel(r'$x$', fontsize = 14)
        #ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 15)
        ax.set_title('individual models')
        
        ax1 = axs[1]
        ax2 = axs[2]
        ax1.scatter(self.x,self.y,color = 'k',s = 40,edgecolor = 'w',linewidth = 0.9,zorder = 1)
        ax2.scatter(self.x,self.y,color = 'k',s = 40,edgecolor = 'w',linewidth = 0.9,zorder = 1)
        
        ### clean up panels ###             
        ax1.set_xlim([xmin,xmax])
        ax1.set_ylim([ymin,ymax])
        
        ax2.set_xlim([xmin,xmax])
        ax2.set_ylim([ymin,ymax])
        
        # label axes
        #ax1.set_xlabel(r'$x$', fontsize = 14)
        #ax1.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 15)
        
        #ax2.set_xlabel(r'$x$', fontsize = 14)
        #ax2.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 15)
        
        # plot fit on residual
        s = np.linspace(xmin,xmax,2000)
        
        # plot fit on residual
        t_ave = []
        self.univ_ind = 0
        for k in range(len(runs)):
            # get current run
            tree = runs[k]

            
            depth = tree.best_depth
            t = []
            for val in s:
                val = np.array([val])[np.newaxis,:]
                out = tree.evaluate_tree(val,depth)
                t.append(out)
            t = np.array(t)           

            
            ax.plot(s.flatten(),t.flatten(),linewidth = 2,alpha = 0.4,color = self.plot_colors[self.univ_ind],zorder = 0)
            #ax1.plot(s.T,t.T,linewidth = 2,alpha = 0.4,color = self.plot_colors[self.univ_ind])
            #ax2.plot(s.T,t.T,linewidth = 2,alpha = 0.4,color = self.plot_colors[self.univ_ind])

            t_ave.append(t)
            self.univ_ind += 1

        t_ave = np.array(t_ave)
        t_ave = np.swapaxes(t_ave,0,1)[0,:,:]
        t_ave1 = np.mean(t_ave,axis = 0)
        t_ave2 = np.median(t_ave,axis = 0)
        
        # plot mean model
        ax2.plot(s.T,t_ave1.T,linewidth = 4,c = 'k',alpha = 1,zorder = 0)
        ax2.plot(s.T,t_ave1.T,linewidth = 3.5,c = 'r',alpha = 1,zorder = 0)
        ax2.set_title('mean model')

        # plot median model
        ax1.plot(s.T,t_ave2.T,linewidth = 4,c = 'k',alpha = 1,zorder = 0)
        ax1.plot(s.T,t_ave2.T,linewidth = 3.5,c = 'r',alpha = 1,zorder = 0)
        ax1.set_title('median model')
        
        for axis in [ax,ax1,ax2]:
            # turn off ticks and labels
            plt.setp(axis.get_yticklabels(), visible=False)
            axis.yaxis.set_tick_params(size=0)
            axis.yaxis.tick_left()
            plt.setp(axis.get_xticklabels(), visible=False)
            axis.xaxis.set_tick_params(size=0)
        
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
        ax.scatter(self.x,self.y,color = 'k',s = 110,edgecolor = 'w',linewidth = 1.5,zorder = 1)
        
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
        #t_ave1 = np.mean(t_ave,axis = 0)   
        t_ave2 = np.median(t_ave,axis = 0).T   
        
        # plot ave model
        s = all_models[0][0]

        ax.plot(s.T,t_ave2.T,linewidth = 5,c = 'k',alpha = 1,zorder = 0)
        ax.plot(s.T,t_ave2.T,linewidth = 4,c = 'r',alpha = 1,zorder = 0)

        ### clean up panels ###             
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])
        
        # label axes
        #ax.set_xlabel(r'$x$', fontsize = 14)
        #ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 5)
            
    def draw_fit_trainval(self,ax,tree):
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
        train_inds = tree.train_inds
        valid_inds = tree.valid_inds
        ax.scatter(self.x[:,train_inds],self.y[:,train_inds],color = self.colors[1],s = 17,edgecolor = 'k',linewidth = 0.9,zorder = 1)
        ax.scatter(self.x[:,valid_inds],self.y[:,valid_inds],color = self.colors[0],s = 17,edgecolor = 'k',linewidth = 0.9,zorder = 1)
        
        # plot fit on residual
        s = np.linspace(xmin,xmax,2000)


        
        depth = tree.best_depth
        t = []
        for val in s:
            val = np.array([val])[np.newaxis,:]
            out = tree.evaluate_tree(val,depth)
            t.append(out)
        s = s
        t = np.array(t)  
        
        
        ax.plot(s.flatten(),t.flatten(),linewidth = 2,c = 'k',alpha = 1,zorder = 0)
        ax.plot(s.flatten(),t.flatten(),linewidth = 1,alpha = 1,color = self.plot_colors[self.univ_ind],zorder = 0)

        ### clean up panels ###             
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])
        
        # label axes
        #ax.axis('off')
        s = s[np.newaxis,:]
        t = t[np.newaxis,:]
        return s,t