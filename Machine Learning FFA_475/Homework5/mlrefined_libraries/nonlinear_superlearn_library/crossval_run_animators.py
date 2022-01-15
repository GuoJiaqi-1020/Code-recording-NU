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
        data = data.T
        self.x = data[:,:-1]
        self.y = data[:,-1:]
        self.colors = ['salmon','cornflowerblue','lime','bisque','mediumaquamarine','b','m','g']
        
        # if 1-d regression data make sure points are sorted
        if np.shape(self.x)[1] == 1:
            ind = np.argsort(self.x.flatten())
            self.x = self.x[ind,:]
            self.y = self.y[ind,:]
        
    #### single dimension regression animation ####
    def animate_1d_regression(self,runs,**kwargs):
        # select inds of history to plot
        num_runs = len(runs)

        # construct figure
        fig = plt.figure(figsize=(9,4))
        artist = fig
        
        # parse any input args
        scatter = 'none'
        if 'scatter' in kwargs:
            scatter = kwargs['scatter']
        show_history = False
        if 'show_history' in kwargs:
            show_history = kwargs['show_history']

        # create subplot with 1 active panel
        gs = gridspec.GridSpec(1, 3, width_ratios=[1,5,1]) 
        ax = plt.subplot(gs[1]); 
        ax1 = plt.subplot(gs[0]); ax1.axis('off')
        ax3 = plt.subplot(gs[2]); ax3.axis('off')
        
        if show_history == True:
            # create subplot with 2 active panels
            gs = gridspec.GridSpec(1, 2, width_ratios=[2,1]) 
            ax = plt.subplot(gs[0]); 
            ax1 = plt.subplot(gs[1]); 
        
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
            
            # get current run for cost function history plot
            run = runs[k]
            
            # pluck out current weights 
            self.draw_fit(ax,runs,k+1)
            
            # show cost function history
            if show_history == True:
                ax1.cla()
                ax1.scatter(current_ind,cost_history[current_ind],s = 60,color = 'r',edgecolor = 'k',zorder = 3)
                self.plot_cost_history(ax1,cost_history,start)
                
            return artist,

        anim = animation.FuncAnimation(fig, animate ,frames=num_frames, interval=num_frames, blit=True)
        
        return(anim)

    # 1d regression demo
    def draw_fit(self,ax,runs,ind):
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

        # scatter points or plot continuous version
        ax.scatter(self.x.flatten(),self.y.flatten(),color = 'k',s = 40,edgecolor = 'w',linewidth = 0.9)
        
        # clean up panel
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])
        
        # label axes
        ax.set_xlabel(r'$x$', fontsize = 16)
        ax.set_ylabel(r'$y$', rotation = 0,fontsize = 16,labelpad = 15)
        
        # plot total fit
        s = np.linspace(xmin,xmax,2000)[np.newaxis,:]
        t = 0
        for i in range(ind):
            # get current run
            run = runs[i]
            cost = run.cost
            predict = run.model
            feat = run.feature_transforms
            normalizer = run.normalizer
            
            # get best weights
            b = np.argmin(run.train_cost_histories[0])
            w_best = run.weight_histories[0][b]
            t += predict(normalizer(s),w_best)

        ax.plot(s.T,t.T,linewidth = 4,c = 'k')
        ax.plot(s.T,t.T,linewidth = 2,c = 'r')
            
    #### compare cost function histories ####
    def plot_cost_history_multimodel(self,ax,history,start):
        # plotting colors
        colors = ['k']
                
        # plot cost function history
        ax.plot(np.arange(start+1,len(history)+1,1),history[start:],linewidth = 3,color = 'k') 

        # clean up panel / axes labels
        xlabel = 'model'
        ylabel = r'$g\left(\mathbf{w}^k\right)$'
        ax.set_xlabel(xlabel,fontsize = 14)
        ax.set_ylabel(ylabel,fontsize = 14,rotation = 0,labelpad = 25)
        title = 'cost history'
        ax.set_title(title,fontsize = 18)
        
        # plotting limits
        xmin = 1; xmax = len(history)+1; xgap = xmax*0.05; 

        xmin -= xgap; xmax += xgap;
        ymin = np.min(history); ymax = np.max(history); ygap = ymax*0.05;
        ymin -= ygap; ymax += ygap;
        
        ax.set_xlim([xmin,xmax]) 
        ax.set_ylim([ymin,ymax]) 
        #ax.set_xticks(np.arange(round(xmin), round(xmax)+1, 1.0))

        
    #### compare cost function histories ####
    def plot_cost_history(self,ax,history,start):
        # plotting colors
        colors = ['k']
                
        # plot cost function history
        ax.plot(np.arange(start,len(history),1),history[start:],linewidth = 3,color = 'k') 

        # clean up panel / axes labels
        xlabel = 'step $k$'
        ylabel = r'$g\left(\mathbf{w}^k\right)$'
        ax.set_xlabel(xlabel,fontsize = 14)
        ax.set_ylabel(ylabel,fontsize = 14,rotation = 0,labelpad = 25)
        title = 'cost history'
        ax.set_title(title,fontsize = 18)
        
        # plotting limits
        xmin = 0; xmax = len(history); xgap = xmax*0.05; 

        xmin -= xgap; xmax += xgap;
        ymin = np.min(history); ymax = np.max(history); ygap = ymax*0.05;
        ymin -= ygap; ymax += ygap;
        
        ax.set_xlim([xmin,xmax]) 
        ax.set_ylim([ymin,ymax]) 
    
    ####### animate static_N2_simple run #######
    def animate_static_N2_simple(self,run,frames,**kwargs):      
        # select inds of history to plot
        weight_history = run.weight_histories[0]
        cost_history = run.cost_histories[0]
        inds = np.arange(0,len(weight_history),int(len(weight_history)/float(frames)))
        weight_history_sample = [weight_history[v] for v in inds]
        cost_history_sample = [cost_history[v] for v in inds]
        start = inds[0]
        
        show_history = False
        if 'show_history' in kwargs:
            show_history = kwargs['show_history']
            
        scatter = 'on'
        if 'scatter' in kwargs:
            scatter = kwargs['scatter']
            
        view = [30,155]
        if 'view' in kwargs:
            view = kwargs['view']
            
        # construct figure
        fig = plt.figure(figsize=(10,4))
        artist = fig
        
        # create subplot with 1 active panel
        gs = gridspec.GridSpec(1, 2, width_ratios=[0.75,1]) 
        ax = plt.subplot(gs[0]); 
        ax1 = plt.subplot(gs[1],projection='3d')

        if show_history == True:
            # create subplot with 2 active panels
            gs = gridspec.GridSpec(1, 3, width_ratios=[2,3,1]) 
            ax = plt.subplot(gs[0]); 
            ax1 = plt.subplot(gs[1],projection='3d')
            ax2 = plt.subplot(gs[2]);
            
        # start animation
        self.move_axis_left(ax1,view)

        num_frames = len(inds)
        print ('starting animation rendering...')
        def animate(k):        
            # get current index to plot
            current_ind = inds[k]

            # clear panels
            ax.cla()
            ax1.cla()
            self.move_axis_left(ax1,view)

            if show_history == True:
                ax2.cla()
                ax2.scatter(current_ind,cost_history[current_ind],s = 60,color = 'r',edgecolor = 'k',zorder = 3)
                self.plot_cost_history(ax2,cost_history,start)

            # print rendering update
            if np.mod(k+1,25) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(num_frames))
            if k == num_frames - 1:
                print ('animation rendering complete!')
                time.sleep(1.5)
                clear_output()

            # pluck out current weights 
            w_best = weight_history[current_ind]

            # plot data
            self.scatter_2d_classification_data(ax,scatter)
            self.scatter_3d_classification_data(ax1,scatter,view)

            # plot surface / boundary
            if k > 0:
                self.show_2d_classifier(ax,w_best,run)
                self.show_3d_classifier(ax1,w_best,run)
            return artist,

        anim = animation.FuncAnimation(fig, animate,frames=num_frames,interval = 25,blit=False)
        
        return(anim)
    
    ####### two-class animator for cross-val #######
    def animate_static_N2_simple(self,run,frames,**kwargs):      
        # select inds of history to plot
        weight_history = run.weight_histories[0]
        cost_history = run.cost_histories[0]
        inds = np.arange(0,len(weight_history),int(len(weight_history)/float(frames)))
        weight_history_sample = [weight_history[v] for v in inds]
        cost_history_sample = [cost_history[v] for v in inds]
        start = inds[0]
        
        show_history = False
        if 'show_history' in kwargs:
            show_history = kwargs['show_history']
            
        scatter = 'on'
        if 'scatter' in kwargs:
            scatter = kwargs['scatter']
            
        view = [30,155]
        if 'view' in kwargs:
            view = kwargs['view']
            
        # construct figure
        fig = plt.figure(figsize=(10,4))
        artist = fig
        
        # create subplot with 1 active panel
        gs = gridspec.GridSpec(1, 2, width_ratios=[0.75,1]) 
        ax = plt.subplot(gs[0]); 
        ax1 = plt.subplot(gs[1],projection='3d')

        if show_history == True:
            # create subplot with 2 active panels
            gs = gridspec.GridSpec(1, 3, width_ratios=[2,3,1]) 
            ax = plt.subplot(gs[0]); 
            ax1 = plt.subplot(gs[1],projection='3d')
            ax2 = plt.subplot(gs[2]);
            
        # start animation
        self.move_axis_left(ax1,view)

        num_frames = len(inds)
        print ('starting animation rendering...')
        def animate(k):        
            # get current index to plot
            current_ind = inds[k]

            # clear panels
            ax.cla()
            ax1.cla()
            self.move_axis_left(ax1,view)

            if show_history == True:
                ax2.cla()
                ax2.scatter(current_ind,cost_history[current_ind],s = 60,color = 'r',edgecolor = 'k',zorder = 3)
                self.plot_cost_history(ax2,cost_history,start)

            # print rendering update
            if np.mod(k+1,25) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(num_frames))
            if k == num_frames - 1:
                print ('animation rendering complete!')
                time.sleep(1.5)
                clear_output()

            # pluck out current weights 
            w_best = weight_history[current_ind]

            # plot data
            self.scatter_2d_classification_data(ax,scatter)
            self.scatter_3d_classification_data(ax1,scatter,view)

            # plot surface / boundary
            if k > 0:
                self.show_2d_classifier(ax,w_best,run)
                self.show_3d_classifier(ax1,w_best,run)
            return artist,

        anim = animation.FuncAnimation(fig, animate,frames=num_frames,interval = 25,blit=False)
        
        return(anim)
    
    ###### multiclass animators ######
    def multiclass_animator(self,run,frames,**kwargs):
        # select inds of history to plot
        weight_history = run.weight_histories[0]
        cost_history = run.cost_histories[0]
        inds = np.arange(0,len(weight_history),int(len(weight_history)/float(frames)))
        weight_history_sample = [weight_history[v] for v in inds]
        cost_history_sample = [cost_history[v] for v in inds]
        start = inds[0]
        
        view = [30,155]
        if 'view' in kwargs:
            view = kwargs['view']
            
        # construct figure
        fig = plt.figure(figsize=(10,4))
        artist = fig
        
        # create subplot with 1 active panel
        gs = gridspec.GridSpec(1, 2, width_ratios=[0.75,1]) 
        ax1 = plt.subplot(gs[0]); 
        ax2 = plt.subplot(gs[1],projection='3d')
          
        # start animation
        self.move_axis_left(ax2,view)

        num_frames = len(inds)
        print ('starting animation rendering...')
        def animate(k):        
            # get current index to plot
            current_ind = inds[k]

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

            # pluck out current weights 
            w_best = weight_history[current_ind]

            # plot surface / boundary
            self.multiclass_plot(ax2,ax1,run,w_best,view)

            return artist,

        anim = animation.FuncAnimation(fig, animate,frames=num_frames,interval = 25,blit=False)
        
        return(anim)
    
    # toy plot
    def multiclass_plot(self,ax1,ax2,run,w,view,**kwargs):
        model = run.model
        normalizer = run.normalizer
        
        ### plot all input data ###
        # generate input range for functions
        minx = min(min(self.x[:,0]),min(self.x[:,1]))
        maxx = max(max(self.x[:,0]),max(self.x[:,1]))
        gapx = (maxx - minx)*0.1
        minx -= gapx
        maxx += gapx

        r = np.linspace(minx,maxx,600)
        w1_vals,w2_vals = np.meshgrid(r,r)
        w1_vals.shape = (len(r)**2,1)
        w2_vals.shape = (len(r)**2,1)
        h = np.concatenate([w1_vals,w2_vals],axis = 1).T

        g_vals = model(normalizer(h),w)
        g_vals = np.asarray(g_vals)
        g_vals = np.argmax(g_vals,axis = 0)

        # vals for cost surface
        w1_vals.shape = (len(r),len(r))
        w2_vals.shape = (len(r),len(r))
        g_vals.shape = (len(r),len(r))

        # scatter points in both panels
        class_nums = np.unique(self.y)
        C = len(class_nums)
        for c in range(C):
            ind = np.argwhere(self.y == class_nums[c])
            ind = [v[0] for v in ind]
            ax1.scatter(self.x[ind,0],self.x[ind,1],self.y[ind],s = 80,color = self.colors[c],edgecolor = 'k',linewidth = 1.5)
            ax2.scatter(self.x[ind,0],self.x[ind,1],s = 110,color = self.colors[c],edgecolor = 'k', linewidth = 2)
            
        # switch for 2class / multiclass view
        if C == 2:
            # plot regression surface
            ax1.plot_surface(w1_vals,w2_vals,g_vals,alpha = 0.1,color = 'k',rstride=20, cstride=20,linewidth=0,edgecolor = 'k') 

            # plot zplane = 0 in left 3d panel - showing intersection of regressor with z = 0 (i.e., its contour, the separator, in the 3d plot too)?
            ax1.plot_surface(w1_vals,w2_vals,g_vals*0,alpha = 0.1,rstride=20, cstride=20,linewidth=0.15,color = 'k',edgecolor = 'k') 
            
            # plot separator in left plot z plane
            ax1.contour(w1_vals,w2_vals,g_vals,colors = 'k',levels = [0],linewidths = 3,zorder = 1)

            # color parts of plane with correct colors
            ax1.contourf(w1_vals,w2_vals,g_vals+1,colors = self.colors[:],alpha = 0.1,levels = range(0,2))
            ax1.contourf(w1_vals,w2_vals,-g_vals+1,colors = self.colors[1:],alpha = 0.1,levels = range(0,2))
    
            # plot separator in right plot
            ax2.contour(w1_vals,w2_vals,g_vals,colors = 'k',levels = [0],linewidths = 3,zorder = 1)

            # adjust height of regressor to plot filled contours
            ax2.contourf(w1_vals,w2_vals,g_vals+1,colors = self.colors[:],alpha = 0.1,levels = range(0,C+1))

            ### clean up panels
            # set viewing limits on vertical dimension for 3d plot           
            minz = min(copy.deepcopy(self.y))
            maxz = max(copy.deepcopy(self.y))

            gapz = (maxz - minz)*0.1
            minz -= gapz
            maxz += gapz

        # multiclass view
        else:   
            ax1.plot_surface(w1_vals,w2_vals,g_vals,alpha = 0.2,color = 'w',rstride=45, cstride=45,linewidth=2,edgecolor = 'k')

            for c in range(C):
                # plot separator curve in left plot z plane
                ax1.contour(w1_vals,w2_vals,g_vals - c,colors = 'k',levels = [0],linewidths = 3,zorder = 1)

                # color parts of plane with correct colors
                ax1.contourf(w1_vals,w2_vals,g_vals - c +0.5,colors = self.colors[c],alpha = 0.4,levels = [0,1])
             
                
            # plot separator in right plot
            ax2.contour(w1_vals,w2_vals,g_vals,colors = 'k',levels = range(0,C+1),linewidths = 3,zorder = 1)
            
            # adjust height of regressor to plot filled contours
            ax2.contourf(w1_vals,w2_vals,g_vals+0.5,colors = self.colors[:],alpha = 0.2,levels = range(0,C+1))

            ### clean up panels
            # set viewing limits on vertical dimension for 3d plot 
            minz = 0
            maxz = max(copy.deepcopy(self.y))
            gapz = (maxz - minz)*0.1
            minz -= gapz
            maxz += gapz
            ax1.set_zlim([minz,maxz])

            ax1.view_init(view[0],view[1]) 

        # clean up panel
        ax1.xaxis.pane.fill = False
        ax1.yaxis.pane.fill = False
        ax1.zaxis.pane.fill = False

        ax1.xaxis.pane.set_edgecolor('white')
        ax1.yaxis.pane.set_edgecolor('white')
        ax1.zaxis.pane.set_edgecolor('white')

        ax1.xaxis._axinfo["grid"]['color'] =  (1,1,1,0)
        ax1.yaxis._axinfo["grid"]['color'] =  (1,1,1,0)
        ax1.zaxis._axinfo["grid"]['color'] =  (1,1,1,0)

        ax1.set_xlabel(r'$x_1$', fontsize = 16,labelpad = 5)
        ax1.set_ylabel(r'$x_2$', rotation = 0,fontsize = 16,labelpad = 5)
        ax1.set_zlabel(r'$y$', rotation = 0,fontsize = 16,labelpad = 5)

        ax2.set_xlabel(r'$x_1$', fontsize = 18,labelpad = 10)
        ax2.set_ylabel(r'$x_2$', rotation = 0,fontsize = 18,labelpad = 15)
        
        
        
    # show coloring of entire space
    def scatter_2d_classification_data(self,ax,scatter,**kwargs):                
        ### from above
        ax.set_xlabel(r'$x_1$',fontsize = 15)
        ax.set_ylabel(r'$x_2$',fontsize = 15,rotation = 0,labelpad = 20)
        ax.xaxis.set_major_formatter(FormatStrFormatter('%.1f'))
        ax.yaxis.set_major_formatter(FormatStrFormatter('%.1f'))

        # plot points in 2d and 3d
        C = len(np.unique(self.y))
        if C == 2:
            ind0 = np.argwhere(self.y == +1)
            ind0 = [v[0] for v in ind0]
            ind1 = np.argwhere(self.y == -1)
            ind1 = [v[0] for v in ind1]

            if scatter == 'on':
                ax.scatter(self.x[ind0,0],self.x[ind0,1],s = 55, color = self.colors[0], edgecolor = 'k')
                ax.scatter(self.x[ind1,0],self.x[ind1,1],s = 55, color = self.colors[1], edgecolor = 'k')
            else:
                ax.scatter(self.x[ind0,0],self.x[ind0,1],s = 55, color = self.colors[0]) #, edgecolor = 'k')
                ax.scatter(self.x[ind1,0],self.x[ind1,1],s = 55, color = self.colors[1]) #, edgecolor = 'k')
        else:
            for c in range(C):
                ind0 = np.argwhere(self.y == c)
                ax.scatter(self.x[ind0,0],self.x[ind0,1],s = 55, color = self.colors[c], edgecolor = 'k')

    def show_2d_classifier(self,ax,w_best,run,**kwargs):
        cost = run.cost
        predict = run.model
        feat = run.feature_transforms
        normalizer = run.normalizer
        
        ### create surface and boundary plot ###
        xmin1 = np.min(copy.deepcopy(self.x[:,0]))
        xmax1 = np.max(copy.deepcopy(self.x[:,0]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = np.min(copy.deepcopy(self.x[:,1]))
        xmax2 = np.max(copy.deepcopy(self.x[:,1]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2    

        # plot boundary for 2d plot
        r1 = np.linspace(xmin1,xmax1,500)
        r2 = np.linspace(xmin2,xmax2,500)
        s,t = np.meshgrid(r1,r2)
        s = np.reshape(s,(np.size(s),1))
        t = np.reshape(t,(np.size(t),1))
        h = np.concatenate((s,t),axis = 1)
        z = predict(normalizer(h.T),w_best)
        z = np.sign(z)
        
        # reshape it
        s.shape = (np.size(r1),np.size(r2))
        t.shape = (np.size(r1),np.size(r2))     
        z.shape = (np.size(r1),np.size(r2))
        
        #### plot contour, color regions ####
        ax.contour(s,t,z,colors='k', linewidths=2.5,levels = [0],zorder = 2)
        ax.contourf(s,t,z,colors = [self.colors[1],self.colors[0]],alpha = 0.15,levels = range(-1,2))
        
        # cleanup panel
        ax.set_xlim([xmin1,xmax1])
        ax.set_ylim([xmin2,xmax2])

    ###### plot plotting functions ######
    def scatter_3d_classification_data(self,ax,scatter,view):        
        # plot points in 2d and 3d
        C = len(np.unique(self.y))
        if C == 2:
            ind0 = np.argwhere(self.y == +1)
            ind0 = [v[0] for v in ind0]
            
            ind1 = np.argwhere(self.y == -1)
            ind1 = [v[0] for v in ind1]
            
            if scatter == 'on':
                ax.scatter(self.x[ind0,0],self.x[ind0,1],self.y[ind0],s = 55, color = self.colors[0], edgecolor = 'k')
                ax.scatter(self.x[ind1,0],self.x[ind1,1],self.y[ind1],s = 55, color = self.colors[1], edgecolor = 'k')
            else:
                ax.scatter(self.x[ind0,0],self.x[ind0,1],self.y[ind0],s = 55, color = self.colors[0])
                ax.scatter(self.x[ind1,0],self.x[ind1,1],self.y[ind1],s = 55, color = self.colors[1])
        else:
            for c in range(C):
                ind0 = np.argwhere(self.y == c)
                ind0 = [v[0] for v in ind0]
                ax.scatter(self.x[ind0,0],self.x[ind0,1],self.y[ind0],s = 55, color = self.colors[c], edgecolor = 'k')
                
        # clean up panel
        ax.set_xlabel(r'$x_1$', fontsize = 12,labelpad = 5)
        ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 12,labelpad = 5)
        ax.set_zlabel(r'$y$', rotation = 0,fontsize = 12,labelpad = 3)
        
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
        
        # set plotting limits
        xmax1 = np.max(copy.deepcopy(self.x[:,0]))
        xmin1 = np.min(copy.deepcopy(self.x[:,0]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmax2 = np.max(copy.deepcopy(self.x[:,1]))
        xmin2 = np.min(copy.deepcopy(self.x[:,1]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        # clean up panel                    
        ax.set_xlim([xmin1,xmax1])
        ax.set_ylim([xmin2,xmax2])
        ax.set_zlim([-1.5,1.5])
        
        self.move_axis_left(ax,view)
    
    def show_3d_classifier(self,ax,w_best,run):
        cost = run.cost
        predict = run.model
        feat = run.feature_transforms
        normalizer = run.normalizer
        
        # set plotting limits
        xmax1 = np.max(copy.deepcopy(self.x[:,0]))
        xmin1 = np.min(copy.deepcopy(self.x[:,0]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmax2 = np.max(copy.deepcopy(self.x[:,1]))
        xmin2 = np.min(copy.deepcopy(self.x[:,1]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2
        
        # plot boundary for 2d plot
        r1 = np.linspace(xmin1,xmax1,200)
        r2 = np.linspace(xmin2,xmax2,200)
        s,t = np.meshgrid(r1,r2)
        s = np.reshape(s,(np.size(s),1))
        t = np.reshape(t,(np.size(t),1))
        h = np.concatenate((s,t),axis = 1)
        z = predict(normalizer(h.T),w_best)
        z = np.sign(z)

        s.shape = (np.size(r1),np.size(r2))
        t.shape = (np.size(r1),np.size(r2))     
        z.shape = (np.size(r1),np.size(r2))
        ax.plot_surface(s,t,z,alpha = 0.3,color = 'w',rstride=10, cstride=10,linewidth=1.5,edgecolor = 'k') 

        
    # scatter points
    def scatter_pts(self,ax,x):
        if np.shape(x)[1] == 1:
            # set plotting limits
            xmax = copy.deepcopy(max(x))
            xmin = copy.deepcopy(min(x))
            xgap = (xmax - xmin)*0.2
            xmin -= xgap
            xmax += xgap
            
            ymax = max(self.y)
            ymin = min(self.y)
            ygap = (ymax - ymin)*0.2
            ymin -= ygap
            ymax += ygap    

            # initialize points
            ax.scatter(x,self.y,color = 'k', edgecolor = 'w',linewidth = 0.9,s = 40)

            # clean up panel
            ax.set_xlim([xmin,xmax])
            ax.set_ylim([ymin,ymax])
            
        if np.shape(x)[1] == 2:
            # set plotting limits
            xmax1 = np.max(copy.deepcopy(x[:,0]))
            xmin1 = np.min(copy.deepcopy(x[:,0]))
            xgap1 = (xmax1 - xmin1)*0.1
            xmin1 -= xgap1
            xmax1 += xgap1
            
            xmax2 = np.max(copy.deepcopy(x[:,1]))
            xmin2 = np.min(copy.deepcopy(x[:,1]))
            xgap2 = (xmax2 - xmin2)*0.1
            xmin2 -= xgap2
            xmax2 += xgap2
            
            ymax = np.max(copy.deepcopy(y))
            ymin = np.min(copy.deepcopy(y))
            ygap = (ymax - ymin)*0.2
            ymin -= ygap
            ymax += ygap    

            # initialize points
            ax.scatter(x[:,0],x[:,1],self.y.flatten(),s = 40,color = 'k', edgecolor = 'w',linewidth = 0.9)

            # clean up panel
            ax.set_xlim([xmin1,xmax1])
            ax.set_ylim([xmin2,xmax2])
            ax.set_zlim([ymin,ymax])
            
            ax.set_xticks(np.arange(round(xmin1), round(xmax1)+1, 1.0))
            ax.set_yticks(np.arange(round(xmin2), round(xmax2)+1, 1.0))
            ax.set_zticks(np.arange(round(ymin), round(ymax)+1, 1.0))
           
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
           
    # set axis in left panel
    def move_axis_left(self,ax,view):
        tmp_planes = ax.zaxis._PLANES 
        ax.zaxis._PLANES = ( tmp_planes[2], tmp_planes[3], 
                             tmp_planes[0], tmp_planes[1], 
                             tmp_planes[4], tmp_planes[5])

        ax.view_init(*view) 
