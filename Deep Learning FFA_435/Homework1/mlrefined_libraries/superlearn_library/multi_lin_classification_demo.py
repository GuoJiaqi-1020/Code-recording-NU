# import custom JS animator
from mlrefined_libraries.JSAnimation_slider_only import IPython_display_slider_only

# import standard plotting and animation
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
from IPython.display import clear_output

# import autograd functionality
from autograd import grad as compute_grad   # The only autograd function you may ever need
import autograd.numpy as np
from autograd import hessian as compute_hess
import math
import time
from matplotlib import gridspec
import copy

class Visualizer:
    '''
    Visualize linear classification and fits in 2d (for N=1 dimensional input datasets)
    '''
    #### initialize ####
    def __init__(self,data):
        # grab input
        data = data.T
        self.x = data[:,:-1]
        self.y = data[:,-1]
   
    ###### plot plotting functions for single input multiclass dataset ######
    def plot_data(self):
        # construct figure
        fig, axs = plt.subplots(1, 3, figsize=(9,4))

        # create subplot with 2 panels
        gs = gridspec.GridSpec(1, 3, width_ratios=[1,5,1]) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off') 
        ax2 = plt.subplot(gs[1]); 
        ax3 = plt.subplot(gs[2]); ax3.axis('off')

        # scatter points
        xmin,xmax = self.scatter_pts(ax2,self.x,self.y)
      
    # scatter points
    def scatter_pts(self,ax,x,y):
        # set plotting limits
        xmax = copy.deepcopy(np.max(x))
        xmin = copy.deepcopy(np.min(x))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap

        ymax = copy.deepcopy(np.max(y))
        ymin = copy.deepcopy(np.min(y))
        ygap = (ymax - ymin)*0.25
        ymin -= ygap
        ymax += ygap    

        # initialize points
        ax.scatter(x,y,color = 'k', edgecolor = 'w',linewidth = 0.9,s = 60)

        # clean up panel
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])

        # label axes
        ax.set_xlabel(r'$x$', fontsize = 15)
        ax.set_ylabel(r'$y$', rotation = 0,fontsize = 15,labelpad = 15)
        
        return xmin,xmax
        
    # plot regression fits
    def plot_fit(self,weights,**kwargs):
        # construct figure
        fig, axs = plt.subplots(1, 3, figsize=(9,4))

        # create subplot with 2 panels
        gs = gridspec.GridSpec(1, 3, width_ratios=[1,5,1]) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off') 
        ax2 = plt.subplot(gs[1]); 
        ax3 = plt.subplot(gs[2]); ax3.axis('off')
    
        # scatter points
        xmin,xmax = self.scatter_pts(ax2,self.x,self.y)
        
        # create fit
        s = np.linspace(xmin,xmax,300)[np.newaxis,:]
        colors = ['k','magenta']
        if 'colors' in kwargs:
            colors = kwargs['colors']
        c = 0
        transformer = lambda a: a
        if 'transformer' in kwargs:
            transformer = kwargs['transformer']
        a = self.model(transformer(s),weights)

        # plot counting cost 
        t = np.argmax(a,axis = 1).flatten()
        ax2.plot(s.flatten(),t,linewidth = 4,color = 'b',zorder = 2)
    
    # compute linear combination of input point
    def model(self,x,w):
        # tack a 1 onto the top of each input point all at once
        o = np.ones((1,np.shape(x)[1]))
        x = np.vstack((o,x))

        # compute linear combination and return
        a = np.dot(x.T,w)
        return a
    
    ####### plot each individual classifier trained and show on each two-class subproblem ######
    def plot_subproblem_data(self):
        C = len(np.unique(self.y))
        
        # construct figure
        fig = plt.figure(figsize=(9,2.5))

        # create subplot with 2 panels
        gs = gridspec.GridSpec(1, C) 
        
        # scatter points
        for c in range(C):
            # create subproblem data
            y_temp = copy.deepcopy(self.y)
            ind = np.argwhere(y_temp.astype(int) == (c))
            ind = ind[:,0]
            ind2 = np.argwhere(y_temp.astype(int) != (c))
            ind2 = ind2[:,0]
            y_temp[ind] = 1
            y_temp[ind2] = -1
        
            # create new axis to plot
            ax = plt.subplot(gs[c])
            xmin,xmax = self.scatter_pts(ax,self.x,y_temp)
            
            # pretty up panel
            title = 'class ' + str(c+1) + ' versus all'
            ax.set_title(title,fontsize = 14)
    
    # plot subproblem data and plot
    def plot_subproblem_fits(self,weights,**kwargs):
        C = len(np.unique(self.y))
        
        # construct figure
        fig = plt.figure(figsize=(9,2.5))

        # create subplot with 2 panels
        gs = gridspec.GridSpec(1, C) 
        
        # scatter points
        for c in range(C):
            # create subproblem data
            y_temp = copy.deepcopy(self.y)
            ind = np.argwhere(y_temp.astype(int) == (c))
            ind = ind[:,0]
            ind2 = np.argwhere(y_temp.astype(int) != (c))
            ind2 = ind2[:,0]
            y_temp[ind] = 1
            y_temp[ind2] = -1
        
            # create new axis to plot
            ax = plt.subplot(gs[c])
            xmin,xmax = self.scatter_pts(ax,self.x,y_temp)
            
            # create fit
            s = np.linspace(xmin,xmax,300)[np.newaxis,:]
            transformer = lambda a: a
            if 'transformer' in kwargs:
                transformer = kwargs['transformer']
            a = self.model(transformer(s),weights[:,c])

            # plot counting cost 
            t = np.sign(a).flatten() 
            ax.plot(s.flatten(),t,linewidth = 4,color = 'b',zorder = 2)
            
            # pretty up panel
            title = 'class ' + str(c+1) + ' versus all'
            ax.set_title(title,fontsize = 14)

    # plot points on contour
    def plot_pts_on_contour(self,ax,j,color):
        # plot connector between points for visualization purposes
        w_old = self.w_hist[j-1]
        w_new = self.w_hist[j]
        g_old = self.least_squares(w_old)
        g_new = self.least_squares(w_new)
     
        ax.plot([w_old[0],w_new[0]],[w_old[1],w_new[1]],color = color,linewidth = 3,alpha = 1,zorder = 2)      # plot approx
        ax.plot([w_old[0],w_new[0]],[w_old[1],w_new[1]],color = 'k',linewidth = 3 + 1,alpha = 1,zorder = 1)      # plot approx
    
    ###### function plotting functions #######
    def plot_ls_cost(self,**kwargs):
        # construct figure
        fig, axs = plt.subplots(1, 2, figsize=(8,3))

        # create subplot with 2 panels
        gs = gridspec.GridSpec(1, 2, width_ratios=[1,1]) 
        ax1 = plt.subplot(gs[0],aspect = 'equal'); 
        ax2 = plt.subplot(gs[1],projection='3d'); 
        
        # pull user-defined args
        viewmax = 3
        if 'viewmax' in kwargs:
            viewmax = kwargs['viewmax']
        view = [20,100]
        if 'view' in kwargs:
            view = kwargs['view']
        num_contours = 15
        if 'num_contours' in kwargs:
            num_contours = kwargs['num_contours']
        
        # make contour plot in left panel
        self.contour_plot(ax1,viewmax,num_contours)
        
        # make contour plot in right panel
        self.surface_plot(ax2,viewmax,view)
        
        plt.show()
        
    ### visualize the surface plot of cost function ###
    def surface_plot(self,ax,wmax,view):
        ##### Produce cost function surface #####
        wmax += wmax*0.1
        r = np.linspace(-wmax,wmax,200)

        # create grid from plotting range
        w1_vals,w2_vals = np.meshgrid(r,r)
        w1_vals.shape = (len(r)**2,1)
        w2_vals.shape = (len(r)**2,1)
        w_ = np.concatenate((w1_vals,w2_vals),axis = 1)
        g_vals = []
        for i in range(len(r)**2):
            g_vals.append(self.least_squares(w_[i,:]))
        g_vals = np.asarray(g_vals)

        # reshape and plot the surface, as well as where the zero-plane is
        w1_vals.shape = (np.size(r),np.size(r))
        w2_vals.shape = (np.size(r),np.size(r))
        g_vals.shape = (np.size(r),np.size(r))
        
        # plot cost surface
        ax.plot_surface(w1_vals,w2_vals,g_vals,alpha = 0.1,color = 'w',rstride=25, cstride=25,linewidth=1,edgecolor = 'k',zorder = 2)  
        
        # clean up panel
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False

        ax.xaxis.pane.set_edgecolor('white')
        ax.yaxis.pane.set_edgecolor('white')
        ax.zaxis.pane.set_edgecolor('white')

        ax.xaxis._axinfo["grid"]['color'] =  (1,1,1,0)
        ax.yaxis._axinfo["grid"]['color'] =  (1,1,1,0)
        ax.zaxis._axinfo["grid"]['color'] =  (1,1,1,0)

        ax.set_xlabel(r'$w_0$',fontsize = 12)
        ax.set_ylabel(r'$w_1$',fontsize = 12,rotation = 0)
        ax.set_title(r'$g\left(w_0,w_1\right)$',fontsize = 13)

        ax.view_init(view[0],view[1])
        
    ### visualize contour plot of cost function ###
    def contour_plot(self,ax,wmax,num_contours):
        #### define input space for function and evaluate ####
        w1 = np.linspace(-wmax,wmax,100)
        w2 = np.linspace(-wmax,wmax,100)
        w1_vals, w2_vals = np.meshgrid(w1,w2)
        w1_vals.shape = (len(w1)**2,1)
        w2_vals.shape = (len(w2)**2,1)
        h = np.concatenate((w1_vals,w2_vals),axis=1)
        func_vals = np.asarray([self.least_squares(s) for s in h])
        w1_vals.shape = (len(w1),len(w1))
        w2_vals.shape = (len(w2),len(w2))
        func_vals.shape = (len(w1),len(w2)) 

        ### make contour right plot - as well as horizontal and vertical axes ###
        # set level ridges
        levelmin = min(func_vals.flatten())
        levelmax = max(func_vals.flatten())
        cutoff = 0.5
        cutoff = (levelmax - levelmin)*cutoff
        numper = 3
        levels1 = np.linspace(cutoff,levelmax,numper)
        num_contours -= numper

        levels2 = np.linspace(levelmin,cutoff,min(num_contours,numper))
        levels = np.unique(np.append(levels1,levels2))
        num_contours -= numper
        while num_contours > 0:
            cutoff = levels[1]
            levels2 = np.linspace(levelmin,cutoff,min(num_contours,numper))
            levels = np.unique(np.append(levels2,levels))
            num_contours -= numper

        a = ax.contour(w1_vals, w2_vals, func_vals,levels = levels,colors = 'k')
        ax.contourf(w1_vals, w2_vals, func_vals,levels = levels,cmap = 'Blues')
                
        # clean up panel
        ax.set_xlabel('$w_0$',fontsize = 12)
        ax.set_ylabel('$w_1$',fontsize = 12,rotation = 0)
        ax.set_title(r'$g\left(w_0,w_1\right)$',fontsize = 13)

        ax.axhline(y=0, color='k',zorder = 0,linewidth = 0.5)
        ax.axvline(x=0, color='k',zorder = 0,linewidth = 0.5)
        ax.set_xlim([-wmax,wmax])
        ax.set_ylim([-wmax,wmax])