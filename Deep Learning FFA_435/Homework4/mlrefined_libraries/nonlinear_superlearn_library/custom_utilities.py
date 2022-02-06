# import standard plotting and animation
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib import gridspec
from IPython.display import clear_output
from mpl_toolkits.mplot3d import proj3d
from matplotlib.text import Annotation
from mpl_toolkits.mplot3d.proj3d import proj_transform

# import autograd functionality
import numpy as np
import math
import time
import copy

class Visualizer:
    '''
    Various plotting functions for hoemwork 3 of deep learning from scratch course
    '''             

    # plot data and predict function
    def plot_data_fit(self,x,y,**kwargs):
        # create figure and plot data
        fig, ax = plt.subplots(1, 1, figsize=(6,3))
        ax.scatter(x,y,color = 'k',edgecolor = 'w'); 

        # cleanup panel
        xmin = copy.deepcopy(min(x))
        xmax = copy.deepcopy(max(x))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap 

        ymin = copy.deepcopy(min(y))
        ymax = copy.deepcopy(max(y))
        ygap = (ymax - ymin)*0.25
        ymin -= ygap
        ymax += ygap

        # set viewing limits
        ax.set_xlim(xmin,xmax)
        ax.set_ylim(ymin,ymax)

        # check if we have a model to fit
        if 'predict' in kwargs:
            predict = kwargs['predict']
            weights = kwargs['weights']

            s = np.linspace(xmin,xmax,200)
            t = [predict(v,weights) for v in s]
            ax.plot(s,t,linewidth = 2.25, color = 'r',zorder = 3)
        plt.show()

    # a small Python function for plotting the distributions of input features
    def feature_distributions(self,x,title,**kwargs):
        # create figure 
        fig, ax = plt.subplots(1, 1, figsize=(9,3))
        
        # create min and max viewing ranges for plot
        xmin = min(np.min(copy.deepcopy(x),axis = 1))
        xmax = max(np.max(copy.deepcopy(x),axis = 1))
        xgap = (xmax - xmin)*0.05
        xmin -= xgap
        xmax += xgap
        xrange = np.linspace(xmin,xmax,200)
        yrange = np.ones((200,1))

        # loop over input and plot each individual input dimension value
        N = np.shape(x)[1]    # dimension of input
        for n in range(N):
            # scatter data
            ax.scatter((n+1)*np.ones((len(x),1)),x[:,n],color = 'k',edgecolor = 'w',zorder = 2)
            
            # plot visual guide
            ax.plot((n+1)*yrange,xrange,color = 'r',linewidth = 0.5,zorder = 1)

        # set xtick labels 
        ticks = np.arange(1,N+1)
        labels = [r'$x_' + str(n+1) + '$' for n in range(N)]
        ax.set_xticks(ticks)
        if 'labels' in kwargs:
            labels = kwargs['labels']
        ax.set_xticklabels(labels, minor=False)

        # label axes and title of plot, then show
        ax.set_xlabel('input dimension / feature')
        ax.set_title(title)
        plt.show()
    
    # activation function
    def activation(self,t):
        # relu activation
    #     f = np.maximum(0,t)

        # tanh activation
        f = np.tanh(t)
        return f

    # fully evaluate our network features using the tensor of weights in omega_inner
    def compute_activation_distributions(self, x):
        # copy weights over
        omega_inner = self.w_init[0] 
        
        # container for each activation distribution
        distributions = [x]
        
        # pad input
        o = np.ones((np.shape(x)[0],1))        
        a_padded = np.concatenate((o,x),axis = 1)

        # loop through each layer matrix
        for W in omega_inner:
            # output of layer activation
            a = self.activation(np.dot(a_padded,W))
            
            # record distribution of activation outputs
            distributions.append(a)

            #  pad with ones (to compactly take care of bias) for next layer computation
            o = np.ones((np.shape(a)[0],1))
            a_padded = np.concatenate((o,a),axis = 1)

        return distributions
    
    # a normalization function
    def normalize(self,data,data_mean,data_std):
        normalized_data = (data - data_mean)/data_std
        return normalized_data

    # fully evaluate our network features using the tensor of weights in omega_inner
    def compute_normalized_activation_distributions(self, x):
        # copy weights over
        omega_inner = self.w_init[0] 
        
        # compute the mean and standard deviation of our input
        x_means = np.mean(x,axis = 0)
        x_stds = np.std(x,axis = 0)

        # normalize data using the function above
        x_normed = self.normalize(x,x_means,x_stds)
        
        # container for each activation distribution
        distributions = [x_normed]
        
        # pad input
        o = np.ones((np.shape(x_normed)[0],1))        
        a_padded = np.concatenate((o,x_normed),axis = 1)

        # loop through each layer matrix
        for W in omega_inner:
            # output of layer activation
            a = self.activation(np.dot(a_padded,W))
            
            # compute the mean and standard deviation of our input
            a_means = np.mean(a,axis = 0)
            a_stds = np.std(a,axis = 0)

            # normalize data using the function above
            a_normed = self.normalize(a,a_means,a_stds)
        
            # record distribution of activation outputs
            distributions.append(a_normed)

            #  pad with ones (to compactly take care of bias) for next layer computation
            o = np.ones((np.shape(a_normed)[0],1))
            a_padded = np.concatenate((o,a_normed),axis = 1)

        return distributions
        
    # a small Python function for plotting the distributions deep activation output
    def activation_distributions(self,x,w_init,**kwargs):
        self.w_init = w_init
        kind = 'unnormalized'
        if 'kind' in kwargs:
            kind = kwargs['kind']
        
        distributions = 0
        # compute original activation distributions
        if kind == 'unnormalized':
            distributions = self.compute_activation_distributions(x)
        if kind == 'normalized':
            distributions = self.compute_normalized_activation_distributions(x)

        # create figure 
        num_layers = len(distributions)
        fig, axs = plt.subplots(num_layers,1, figsize=(9,2*num_layers))
        
        for k in range(len(distributions)):
            # pick current distribution
            dist = distributions[k]
            
            # create min and max viewing ranges for plot
            xmin = min(np.min(copy.deepcopy(dist),axis = 1))
            xmax = max(np.max(copy.deepcopy(dist),axis = 1))
            xgap = (xmax - xmin)*0.05
            xmin -= xgap
            xmax += xgap
            xrange = np.linspace(xmin,xmax,200)
            yrange = np.ones((200,1))

            # loop over input and plot each individual input dimension value
            N = np.shape(dist)[1]    # dimension of input
            for n in range(N):
                # scatter data
                axs[k].scatter((n+1)*np.ones((len(dist),1)),dist[:,n],color = 'k',edgecolor = 'w',zorder = 2)

                # plot visual guide
                axs[k].plot((n+1)*yrange,xrange,color = 'r',linewidth = 0.5,zorder = 1)

            # set xtick labels 
            ticks = np.arange(1,N+1)
            axs[k].set_xticks(ticks)

            labels = 0
            if k == 0:
                if n == 0:
                    labels = [r'$x$']
                else:
                    labels = [r'$x_' + str(n+1) + '$' for n in range(N)]
            else:
                labels = [r'$a_{' + str(n+1) + '}^{(' + str(k) + ')}$' for n in range(N)]
                
            axs[k].set_xticklabels(labels, minor=False)

            # label axes and title of plot, then show
            if k == 0:
                axs[k].set_title('input dimension',fontsize = 12)
            else:
                axs[k].set_title('layer ' + str(k)  + ' activation outputs',fontsize = 12)
                            
        #ax.set_title(title)
        plt.show()
    

    # compare regression cost histories from multiple runs
    def compare_regression_histories(self,histories,start):
        # initialize figure
        fig = plt.figure(figsize = (7,3))

        # create subplot with 1 panel
        gs = gridspec.GridSpec(1, 1) 
        ax = plt.subplot(gs[0]); 

        # run through input histories, plotting each beginning at 'start' iteration
        c = 1   # paramter controls width of cost function plot, so if we get overlapping histories we can still see both visually
        for history in histories:
            ax.plot(np.arange(start,len(history),1),history[start:],label = 'run ' + str(c),linewidth = 4*(0.8)**(c))
            c += 1

        # clean up panel
        ax.set_xlabel('iteration',fontsize = 10)
        ax.set_ylabel('cost function value',fontsize = 10)
        plt.legend(loc='upper right')
        ax.set_xlim([start - 1,len(history)+1])
        plt.show()
        
    
    # compare regression cost histories from multiple runs
    def compare_classification_histories(self,count_histories,cost_histories,start,**kwargs):
        # initialize figure
        fig = plt.figure(figsize = (9,3))

        # create subplot with 1 panel
        gs = gridspec.GridSpec(1, 2,width_ratios = [1,1]) 
        ax1 = plt.subplot(gs[0]); 
        ax2 = plt.subplot(gs[1]); 
        
        labels = [' ',' ']
        if 'labels' in kwargs:
            labels = kwargs['labels']

        # run through input histories, plotting each beginning at 'start' iteration
        for c in range(len(count_histories)):
            count_hist = count_histories[c]
            cost_hist = cost_histories[c]
            
            label = 0
            if c == 0:
                label = labels[0]
            else:
                label = labels[1]
            ax1.plot(np.arange(start,len(count_hist),1),count_hist[start:],linewidth = 3*(0.8)**(c+1))
            
            # check if a label exists, if so add it to the plot
            if np.size(label) == 0:
                ax2.plot(np.arange(start,len(cost_hist),1),cost_hist[start:],linewidth = 3*(0.8)**(c+1))
            else:
                ax2.plot(np.arange(start,len(cost_hist),1),cost_hist[start:],label = label,linewidth = 3*(0.8)**(c+1))
                

        # clean up panel
        ax1.set_xlabel('iteration',fontsize = 10)
        ax2.set_xlabel('iteration',fontsize = 10)
        ax1.set_ylabel('num misclassifications',fontsize = 10)
        ax2.set_ylabel('cost function value',fontsize = 10)
        ax1.set_title('number of misclassifications',fontsize = 12)
        ax2.set_title('cost function value',fontsize = 12)
        if np.size(label) > 0:
            plt.legend(loc='upper right')
        ax1.set_xlim([start - 1,len(count_histories[0])+1])
        ax2.set_xlim([start - 1,len(count_histories[0])+1])
        plt.show()
    
    # show contour plot of input function
    def draw_setup(self,g,**kwargs):
        self.g = g                         # input function        
        xmin = -3.1
        xmax = 3.1
        ymin = -3.1
        ymax = 3.1
        num_contours = 20
        if 'xmin' in kwargs:            
            xmin = kwargs['xmin']
        if 'xmax' in kwargs:
            xmax = kwargs['xmax']
        if 'ymin' in kwargs:            
            ymin = kwargs['ymin']
        if 'ymax' in kwargs:
            ymax = kwargs['ymax']            
        if 'num_contours' in kwargs:
            num_contours = kwargs['num_contours']   
            
        # choose viewing range using weight history?
        if 'view_by_weights' in kwargs:
            view_by_weights = True
            weight_history = kwargs['weight_history']
            if view_by_weights == True:
                xmin = min([v[0] for v in weight_history])[0]
                xmax = max([v[0] for v in weight_history])[0]
                xgap = (xmax - xmin)*0.25
                xmin -= xgap
                xmax += xgap

                ymin = min([v[1] for v in weight_history])[0]
                ymax = max([v[1] for v in weight_history])[0]
                ygap = (ymax - ymin)*0.25
                ymin -= ygap
                ymax += ygap
        
        ##### construct figure with panels #####
        # construct figure
        fig = plt.figure(figsize = (10,4))

        # remove whitespace from figure
        fig.subplots_adjust(left=0, right=1, bottom=0, top=1) # remove whitespace

        # create subplot with 3 panels, plot input function in center plot
        gs = gridspec.GridSpec(1, 3, width_ratios=[1,4,1]) 
        ax = plt.subplot(gs[0]);ax.axis('off');
        ax1 = plt.subplot(gs[1],aspect='equal');
        ax2 = plt.subplot(gs[2]);ax2.axis('off');

        ### plot function as contours ###
        #self.draw_surface(ax,wmin,wmax,wmin,wmax)
        self.draw_contour_plot(ax1,num_contours,xmin,xmax,ymin,ymax)
        
        ### cleanup panels ###
        ax1.set_xlabel('$w_0$',fontsize = 12)
        ax1.set_ylabel('$w_1$',fontsize = 12,labelpad = 15,rotation = 0)
        ax1.axhline(y=0, color='k',zorder = 0,linewidth = 0.5)
        ax1.axvline(x=0, color='k',zorder = 0,linewidth = 0.5)
        
        ax1.set_xticks(np.arange(round(xmin),round(xmax)+1))
        ax1.set_yticks(np.arange(round(ymin),round(ymax)+1))
        
        # set viewing limits
        ax1.set_xlim(xmin,xmax)
        ax1.set_ylim(ymin,ymax)
        
        # if weight history are included, plot on the contour
        if 'weight_history' in kwargs:
            self.w_hist = kwargs['weight_history']
            self.draw_weight_path(ax1)
        
        # plot
        plt.show()
        
    ### function for drawing weight history path
    def draw_weight_path(self,ax):
        # make color range for path
        s = np.linspace(0,1,len(self.w_hist[:round(len(self.w_hist)/2)]))
        s.shape = (len(s),1)
        t = np.ones(len(self.w_hist[round(len(self.w_hist)/2):]))
        t.shape = (len(t),1)
        s = np.vstack((s,t))
        colorspec = []
        colorspec = np.concatenate((s,np.flipud(s)),1)
        colorspec = np.concatenate((colorspec,np.zeros((len(s),1))),1)

        ### plot function decrease plot in right panel
        for j in range(len(self.w_hist)):  
            w_val = self.w_hist[j]
            g_val = self.g(w_val)

            # plot each weight set as a point
            ax.scatter(w_val[0],w_val[1],s = 30,c = colorspec[j],edgecolor = 'k',linewidth = 2*math.sqrt((1/(float(j) + 1))),zorder = 3)

            # plot connector between points for visualization purposes
            if j > 0:
                w_old = self.w_hist[j-1]
                w_new = self.w_hist[j]
                g_old = self.g(w_old)
                g_new = self.g(w_new)
         
                ax.plot([w_old[0],w_new[0]],[w_old[1],w_new[1]],color = colorspec[j],linewidth = 2,alpha = 1,zorder = 2)      # plot approx
                ax.plot([w_old[0],w_new[0]],[w_old[1],w_new[1]],color = 'k',linewidth = 2 + 0.4,alpha = 1,zorder = 1)      # plot approx
             
    ### function for creating contour plot
    def draw_contour_plot(self,ax,num_contours,xmin,xmax,ymin,ymax):
            
        #### define input space for function and evaluate ####
        w1 = np.linspace(xmin,xmax,400)
        w2 = np.linspace(ymin,ymax,400)
        w1_vals, w2_vals = np.meshgrid(w1,w2)
        w1_vals.shape = (len(w1)**2,1)
        w2_vals.shape = (len(w2)**2,1)
        h = np.concatenate((w1_vals,w2_vals),axis=1)
        func_vals = np.asarray([ self.g(np.reshape(s,(2,1))) for s in h])

        w1_vals.shape = (len(w1),len(w1))
        w2_vals.shape = (len(w2),len(w2))
        func_vals.shape = (len(w1),len(w2)) 

        ### make contour right plot - as well as horizontal and vertical axes ###
        # set level ridges
        levelmin = min(func_vals.flatten())
        levelmax = max(func_vals.flatten())
        cut = 0.4
        cutoff = (levelmax - levelmin)
        levels = [levelmin + cutoff*cut**(num_contours - i) for i in range(0,num_contours+1)]
        levels = [levelmin] + levels
        levels = np.asarray(levels)
   
        a = ax.contour(w1_vals, w2_vals, func_vals,levels = levels,colors = 'k')
        b = ax.contourf(w1_vals, w2_vals, func_vals,levels = levels,cmap = 'Blues')
        
    ### draw surface plot
    def draw_surface(self,ax,xmin,xmax,ymin,ymax):
        #### define input space for function and evaluate ####
        w1 = np.linspace(xmin,xmax,200)
        w2 = np.linspace(ymin,ymax,200)
        w1_vals, w2_vals = np.meshgrid(w1,w2)
        w1_vals.shape = (len(w1)**2,1)
        w2_vals.shape = (len(w2)**2,1)
        h = np.concatenate((w1_vals,w2_vals),axis=1)
        func_vals = np.asarray([ self.g(np.reshape(s,(2,1))) for s in h])

        ### plot function as surface ### 
        w1_vals.shape = (len(w1),len(w2))
        w2_vals.shape = (len(w1),len(w2))
        func_vals.shape = (len(w1),len(w2))

        ax.plot_surface(w1_vals, w2_vals, func_vals, alpha = 0.1,color = 'w',rstride=25, cstride=25,linewidth=1,edgecolor = 'k',zorder = 2)

        # plot z=0 plane 
        ax.plot_surface(w1_vals, w2_vals, func_vals*0, alpha = 0.1,color = 'w',zorder = 1,rstride=25, cstride=25,linewidth=0.3,edgecolor = 'k') 
        
        # clean up axis
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False

        ax.xaxis.pane.set_edgecolor('white')
        ax.yaxis.pane.set_edgecolor('white')
        ax.zaxis.pane.set_edgecolor('white')

        ax.xaxis._axinfo["grid"]['color'] =  (1,1,1,0)
        ax.yaxis._axinfo["grid"]['color'] =  (1,1,1,0)
        ax.zaxis._axinfo["grid"]['color'] =  (1,1,1,0)