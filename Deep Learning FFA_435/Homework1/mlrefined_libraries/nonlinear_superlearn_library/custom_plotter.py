# import standard plotting and animation
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib import gridspec
from IPython.display import clear_output
from mpl_toolkits.mplot3d import proj3d
from matplotlib.text import Annotation
from mpl_toolkits.mplot3d.proj3d import proj_transform
from matplotlib import gridspec

# import autograd functionality
import numpy as np
import math
import time
import copy

class Visualizer:
    '''
    Various plotting and visualization functions for illustrating training / fitting of nonlinear regression and classification
    '''             

    ######## functions for regression visualization ########
    # plot regression data
    def plot_regression_data(self,x,y,**kwargs):
        # create figure and plot data
        fig = plt.figure(figsize = (9,4))
        gs = gridspec.GridSpec(1, 3,width_ratios = [1,3,1]) 

        # setup current axis
        ax = plt.subplot(gs[1]);
        
        # scatter regression data
        ax.scatter(x,y,s = 50,color = 'k',edgecolor = 'w',linewidth = 1.1); 

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
        if 'model' in kwargs:
            model = kwargs['model']
            weights = kwargs['weights']

            s = np.linspace(xmin,xmax,200)
            t = [model(np.reshape(v,(1,1)),weights)[0] for v in s];
            ax.plot(s,t,linewidth = 3,zorder = 3)
        plt.show()
    
    # compare regression cost histories from multiple runs
    def compare_regression_histories(self,histories,start,**kwargs):
        # initialize figure
        fig = plt.figure(figsize = (8,3))

        # create subplot with 1 panel
        gs = gridspec.GridSpec(1, 1) 
        ax = plt.subplot(gs[0]); 
        
        # any labels to add?        
        labels = [' ',' ']
        if 'labels' in kwargs:
            labels = kwargs['labels']

        # run through input histories, plotting each beginning at 'start' iteration
        for c in range(len(histories)):
            history = histories[c]
            
            label = 0
            if c == 0:
                label = labels[0]
            else:
                label = labels[1]
                
            # check if a label exists, if so add it to the plot
            if np.size(label) == 0:
                ax.plot(np.arange(start,len(history),1),history[start:],linewidth = 3*(0.8)**(c)) 
            else:               
                ax.plot(np.arange(start,len(history),1),history[start:],linewidth = 3*(0.8)**(c),label = label) 

        # clean up panel
        ax.set_xlabel('iteration',fontsize = 12)
        ax.set_ylabel('cost function value',fontsize = 12)
        ax.set_title('cost function value at each step of gradient descent',fontsize = 15)
        if np.size(label) > 0:
            plt.legend(loc='upper right')
        ax.set_xlim([start - 1,len(history)+1])
        plt.show()
        
        
    ######## functions for regression visualization ########
    def plot_classification_data(self,x,y,**kwargs):
        # initialize figure
        fig = plt.figure(figsize = (9,4))
        gs = gridspec.GridSpec(1, 2,width_ratios = [1,1.25]) 
        
        # set view for 3d panel
        view = [20,45]
        if 'view1' in kwargs:
            view1 = kwargs['view1']
        
        # colors for points (and classified regions)
        custom_colors = ['salmon','cornflowerblue','lime','bisque','mediumaquamarine','b','m','g']

        #### left plot - data and fit in original space ####
        # setup current axis
        ax1 = plt.subplot(gs[0],aspect = 'equal');
        ax2 = plt.subplot(gs[1],projection = '3d');
        
        ### cleanup left plots, create max view ranges ###
        xmin1 = copy.deepcopy(min(x[:,0]))
        xmax1 = copy.deepcopy(max(x[:,0]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1
        ax1.set_xlim([xmin1,xmax1])
        ax2.set_xlim([xmin1,xmax1])

        xmin2 = copy.deepcopy(min(x[:,1]))
        xmax2 = copy.deepcopy(max(x[:,1]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2
        ax1.set_ylim([xmin2,xmax2])
        ax2.set_ylim([xmin2,xmax2])

        ymin = copy.deepcopy(min(y))
        ymax = copy.deepcopy(max(y))
        ygap = (ymax - ymin)*0.05
        ymin -= ygap
        ymax += ygap
        ax2.set_zlim([ymin,ymax])
        
        ax2.axis('off')
        ax2.view_init(view[0],view[1])

        ax1.set_yticklabels([])
        ax1.set_xticklabels([])
        ax1.set_xticks([])
        ax1.set_yticks([])
        ax1.set_xlabel(r'$x_1$',fontsize = 15)
        ax1.set_ylabel(r'$x_2$',fontsize = 15,rotation = 0,labelpad = 20)

        ###### plot data ######
        # plot points in 2d and 3d
        ind0 = np.argwhere(y == 1)
        ind0 = [v[0] for v in ind0]
        ax1.scatter(x[ind0,0],x[ind0,1],s = 55, color = custom_colors[0], edgecolor = 'k')
        ax2.scatter(x[ind0,0],x[ind0,1],y[ind0],s = 55, color = custom_colors[0], edgecolor = 'k')

        ind1 = np.argwhere(y == -1)
        ind1 = [v[0] for v in ind1]
        ax1.scatter(x[ind1,0],x[ind1,1],s = 55, color = custom_colors[1], edgecolor = 'k')
        ax2.scatter(x[ind1,0],x[ind1,1],y[ind1],s = 55, color = custom_colors[1], edgecolor = 'k')
       
        ###### plot fit if input ######
        # check if we have a model to fit
        if 'model' in kwargs:
            model = kwargs['model']
            weights = kwargs['weights']
            
            # or just take last weights        
            zplane = 'on'
            if 'zplane' in kwargs:
                zplane = kwargs['zplane']
            
            # plot boundary for 2d plot
            r1 = np.linspace(xmin1,xmax1,100)
            r2 = np.linspace(xmin2,xmax2,100)
            s,t = np.meshgrid(r1,r2)
            s = np.reshape(s,(np.size(s),1))
            t = np.reshape(t,(np.size(t),1))
            h = np.concatenate((s,t),axis = 1)
            z = []
            for j in range(len(h)):
                h_j = np.reshape(h[j,:],(1,2))
                a = model(h_j,weights)
                z.append(a)
            z = np.asarray(z)
            z = np.tanh(z)

            # reshape it
            s.shape = (np.size(r1),np.size(r2))
            t.shape = (np.size(r1),np.size(r2))     
            z.shape = (np.size(r1),np.size(r2))

            #### plot contour, color regions ####
            ax1.contour(s,t,z,colors='k', linewidths=2.5,levels = [0],zorder = 2)
            ax1.contourf(s,t,z,colors = [custom_colors[1],custom_colors[0]],alpha = 0.15,levels = range(-1,2))
            ax2.plot_surface(s,t,z,alpha = 0.25,color = 'w',rstride=10, cstride=10,linewidth=1,edgecolor = 'k')

            # plot zplane = 0 in left 3d panel - showing intersection of regressor with z = 0 (i.e., its contour, the separator, in the 3d plot too)?
            if zplane == 'on':
                # plot zplane
                ax2.plot_surface(s,t,z*0,alpha = 0.1,rstride=20, cstride=20,linewidth=0.15,color = 'w',edgecolor = 'k') 

                # plot separator curve in left plot
                ax2.contour(s,t,z,colors = 'k',levels = [0],linewidths = 3,zorder = 1)
                ax2.contourf(s,t,z,colors = custom_colors[0],levels = [0,1],zorder = 1,alpha = 0.1)
                ax2.contourf(s,t,z+1,colors = custom_colors[1],levels = [0,1],zorder = 1,alpha = 0.1)
        
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
        
    # plot regression data and compare two nonlinear fits
    def compare_regression_fits(self,x,y,predict1,predict2,weights1,weights2,**kwargs):
        # check if labels desired
        title1 ='run 1'
        title2 = 'run 2'
        if 'title1' in kwargs:
            title1 = kwargs['title1']
        if 'title2' in kwargs:
            title2 = kwargs['title2']
            
        # create figure and plot data
        fig = plt.figure(figsize = (9,4))
        gs = gridspec.GridSpec(1, 2,width_ratios = [1,1]) 

        # setup current axis
        ax = plt.subplot(gs[0]);
        ax1 = plt.subplot(gs[1]);
        
        # scatter regression data
        ax.scatter(x,y,s = 50,color = 'k',edgecolor = 'w',linewidth = 1.1); 
        ax1.scatter(x,y,s = 50,color = 'k',edgecolor = 'w',linewidth = 1.1); 

        # cleanup panel / set viewing range
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
        ax1.set_xlim(xmin,xmax)
        ax1.set_ylim(ymin,ymax)
        
        # plot fits
        s = np.linspace(xmin,xmax,300)
        t = [predict1(np.reshape(v,(1,1)),weights1)[0] for v in s];
        ax.plot(s,t,linewidth = 3,zorder = 3)
        ax.set_title(title1,fontsize = 12)
        
        t = [predict2(np.reshape(v,(1,1)),weights2)[0] for v in s];
        ax1.plot(s,t,linewidth = 3,zorder = 3,color = 'orange')
        ax1.set_title(title2,fontsize = 12)

        plt.show()
        