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
    #### initialize ####
    def __init__(self,csvname):
        # grab input
        data = np.loadtxt(csvname,delimiter = ',')
        self.x = data[:-1,:]
        self.y = data[-1:,:]         
        
        self.colors = ['salmon','cornflowerblue','lime','bisque','mediumaquamarine','b','m','g']
        
        # if 1-d regression data make sure points are sorted
        if np.shape(self.x)[1] == 1:
            ind = np.argsort(self.x.flatten())
            self.x = self.x[ind,:]
            self.y = self.y[ind,:]
            
    ########## regression plotting tools ##########
    def show_regression_runs(self,runs,**kwargs):         
        # construct figure
        num_plots = min(len(runs),3)
        fig, axs = plt.subplots(figsize=(9,3),nrows=1,ncols = num_plots)

        # create labels
        labels = list(np.arange(num_plots))
        if 'labels' in kwargs:
            labels = kwargs['labels']
        
        # loop over axes and plot
        all_models = []
        for k in range(num_plots):
            # get current run for cost function history plot
            run = runs[k]
            ax = axs[k]

            # pluck out current weights 
            self.draw_regression_fit(ax,run)
            
            # remove axes
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)
            
            # set title
            label = labels[k]
            ax.set_title(label,fontsize = 12)
            
    # regression plotter 
    def draw_regression_fit(self,ax,run):
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
        # scatter original data 
        ax.scatter(self.x,self.y,color = 'k',s = 40,edgecolor = 'w',linewidth = 0.9,zorder = 2)
        
        # plot fit on residual
        s = np.linspace(xmin,xmax,2000)[np.newaxis,:]

        # get current run
        model = run.model
        normalizer = run.normalizer
        ind = np.argmin(run.train_cost_histories[0])
        w_best = run.weight_histories[0][ind]

        # get best weights
        t = model(normalizer(s),w_best).T

        ax.plot(s.T,t.T,linewidth = 4,c = 'k',alpha = 1,zorder = 1)
        ax.plot(s.T,t.T,linewidth = 3,c = 'lime',alpha = 1,zorder = 1)

        ### clean up panels ###
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])


    ########## two-class plotting tools ##########
    def show_twoclass_runs(self,runs,**kwargs):
        # construct figure
        num_plots = min(len(runs),3)
        fig, axs = plt.subplots(figsize=(9,3),nrows=1,ncols = num_plots)

        # create labels
        labels = list(np.arange(num_plots))
        if 'labels' in kwargs:
            labels = kwargs['labels']

        # loop over axes and plot
        all_models = []
        for k in range(num_plots):
            # get current run for cost function history plot
            run = runs[k]
            ax = axs[k]

            # pluck out current weights
            self.draw_classification_fit(ax,run)

            # remove axes
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)

            # set title
            label = labels[k]
            ax.set_title(label,fontsize = 12)
        plt.show()

    # classification plotter
    def draw_classification_fit(self,ax,run):
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

        # scatter data
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[0],edgecolor = 'k',linewidth = 1,zorder = 3)

        ind0 = np.argwhere(self.y == -1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45, color = self.colors[1],edgecolor = 'k',linewidth = 1,zorder = 3)

        # setup region for plotting decision boundary
        s1 = np.linspace(xmin1,xmax1,500)
        s2 = np.linspace(xmin2,xmax2,500)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))
        b.shape = (np.size(s1),np.size(s2))

        # get current run
        model = run.model
        normalizer = run.normalizer
        ind = np.argmin(run.train_cost_histories[0])
        w_best = run.weight_histories[0][ind]

        # get best weights
        t = model(normalizer(data=h.T),w_best)
        t = np.sign(t)
        t.shape = (np.size(s1),np.size(s2))

        # plot decision boundary
        ax.contour(a,b,t,colors='k', linewidths=2.5,levels = [0],zorder = 2)
        ax.contourf(a,b,t,colors = [self.colors[1],self.colors[0]],alpha = 0.15,levels = range(-1,2))

    ########## multi-class plotting tools ##########
    def show_multiclass_runs(self,runs,**kwargs):
        # construct figure
        num_plots = min(len(runs),3)
        fig, axs = plt.subplots(figsize=(9,3),nrows=1,ncols = num_plots)

        # create labels
        labels = list(np.arange(num_plots))
        if 'labels' in kwargs:
            labels = kwargs['labels']

        # loop over axes and plot
        all_models = []
        for k in range(num_plots):
            # get current run for cost function history plot
            run = runs[k]
            ax = axs[k]

            # pluck out current weights
            self.draw_multiclass_fit(ax,run)

            # remove axes
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)

            # set title
            label = labels[k]
            ax.set_title(label,fontsize = 12)

    # classification plotter
    def draw_multiclass_fit(self,ax,run):
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

        # plot data
        C = len(np.unique(self.y))
        for c in range(C):
            # plot points
            ind0 = np.argwhere(self.y == c)
            ind0 = [v[1] for v in ind0]
            ax.scatter(self.x[0,ind0],self.x[1,ind0],s = 45,color = self.colors[c], edgecolor ='k',linewidth = 1,zorder = 3)

        # setup region for plotting decision boundary
        s1 = np.linspace(xmin1,xmax1,500)
        s2 = np.linspace(xmin2,xmax2,500)
        a,b = np.meshgrid(s1,s2)
        a = np.reshape(a,(np.size(a),1))
        b = np.reshape(b,(np.size(b),1))
        h = np.concatenate((a,b),axis = 1)
        a.shape = (np.size(s1),np.size(s2))
        b.shape = (np.size(s1),np.size(s2))

        # get current run
        model = run.model
        normalizer = run.normalizer
        ind = np.argmin(run.train_cost_histories[0])
        w_best = run.weight_histories[0][ind]

        # get best weights  
        t = model(normalizer(h.T),w_best)
        t = np.argmax(t,1)             
        t.shape = (np.size(s1),np.size(s2))     

        # plot decision boundary        
        ax.contour(a,b,t,colors = 'k',levels = range(0,C+1),linewidths = 3.5,zorder = 2)
        ax.contourf(a,b,t+1,colors = self.colors[:],alpha = 0.1,levels = range(0,C+1))