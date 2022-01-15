# import standard plotting and animation
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
from IPython.display import clear_output
from matplotlib import gridspec
import autograd.numpy as np
from mlrefined_libraries.JSAnimation_slider_only import IPython_display_slider_only
from . import optimimzers
import copy
import time
import bisect


class Visualizer:
    '''
    Visualizer for stumps (depth 1 trees) for a N = 1 dimension input dataset
    '''

    # load target function
    def load_data(self,csvname):
        data = np.loadtxt(csvname,delimiter = ',')
        self.x = data[0,:][np.newaxis,:]
        self.y = data[1,:][np.newaxis,:]
        
    # initialize after animation call
    def dial_settings(self):
        self.colors = [[1,0,0.4], [ 0, 0.4, 1],[0, 1, 0.5],[1, 0.7, 0.5],[0.7, 0.6, 0.5],'mediumaquamarine']
        
        # create temp copy of data, sort from smallest to largest
        splits = []
        levels = []
        vals = []

        # make a copy of the n^th dimension of the input data (we will sort after this)
        x_n = copy.deepcopy(self.x[0,:])
        y_n = copy.deepcopy(self.y)

        # sort x_n and y_n according to ascending order in x_n
        sorted_inds = np.argsort(x_n,axis = 0)
        x_n = x_n[sorted_inds]
        y_n = y_n[:,sorted_inds]
        c_vals,c_counts = np.unique(self.y,return_counts = True) 
        
        # containers
        self.splits = []
        self.levels = []
        self.vals = []

        # loop over points and create stump in between each pair
        for p in range(self.y.size - 1):
            # compute split point
            split = (x_n[p] + x_n[p+1])/float(2)
                  
            ## determine most common label relative to proportion of each class present ##
            # compute various counts and decide on levels
            y_n_left = y_n[:,:p+1]
            y_n_right = y_n[:,p+1:]
            c_left_vals,c_left_counts = np.unique(y_n_left,return_counts = True) 
            c_right_vals,c_right_counts = np.unique(y_n_right,return_counts = True) 
            prop_left = []
            prop_right = []
            
            for i in range(np.size(c_vals)):
                val = c_vals[i]
                count = c_counts[i]

                # check left side
                val_ind = np.argwhere(c_left_vals==val)
                val_count = 0
                if np.size(val_ind) > 0:
                    val_count = c_left_counts[val_ind][0][0]
                    prop_left.append(val_count/count)

                # check right side
                val_ind = np.argwhere(c_right_vals==val)
                val_count = 0
                if np.size(val_ind) > 0:
                    val_count = c_right_counts[val_ind][0][0]
                    prop_right.append(val_count/count)

            # array it
            prop_left = np.array(prop_left)
            best_left = np.argmax(prop_left)
            left_ave = c_vals[best_left]
            best_acc_left = prop_left[best_left]
            # left = y_n_left.size / y_n.size

            prop_right = np.array(prop_right)
            best_right = np.argmax(prop_right)
            right_ave = c_vals[best_right]
            best_acc_right = prop_right[best_right]
            # right = y_n_right.size / y_n.size
            val = (best_acc_left + best_acc_right)/2

            # store
            self.splits.append(split)
            self.levels.append([left_ave,right_ave])
            self.vals.append(val)
       
    ##### prediction functions #####
    # tree prediction
    def tree_predict(self,pt,w): 
        # our return prediction
        val = 0

        # loop over current stumps and collect weighted evaluation
        for i in range(len(self.splits)):
            # get current stump
            split = self.splits[i]
            levels = self.levels[i]
                
            # check - which side of this split does the pt lie?
            if pt <= split:  # lies to the left - so evaluate at left level
                val += w[i]*levels[0]
            else:
                val += w[i]*levels[1]
        return val

    ###### fit polynomials ######
    def browse_stumps(self,**kwargs):
        # set dials for tanh network and trees
        self.dial_settings()
        self.num_elements = len(self.splits)

        # construct figure
        fig = plt.figure(figsize = (9,5))
        artist = fig

        # create subplot with 3 panels, plot input function in center plot
        gs = gridspec.GridSpec(1, 3, width_ratios=[1,0.1,1]) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off');
        ax2 = plt.subplot(gs[2]); #ax2.axis('off');
        ax3 = plt.subplot(gs[1]); ax3.axis('off');

        # set viewing range for all 3 panels
        xmax = max(copy.deepcopy(self.x[0,:]))
        xmin = min(copy.deepcopy(self.x[0,:]))
        xgap = (xmax - xmin)*0.05
        xmax += xgap
        xmin -= xgap
        ymax = max(copy.deepcopy(self.y[0,:]))
        ymin = min(copy.deepcopy(self.y[0,:]))
        ygap = (ymax - ymin)*0.4
        ymax += ygap
        ymin -= ygap
        
        # animate
        print ('beginning animation rendering...')
        def animate(k):
            # clear the panel
            ax1.cla()
            
            # print rendering update
            if np.mod(k+1,5) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(self.num_elements))
            if k == self.num_elements - 1:
                print ('animation rendering complete!')
                time.sleep(1)
                clear_output()
                                
            ####### plot a stump ######
            # pick a stump
            w = np.zeros((self.num_elements,1))
            w[k] = 1
            
            # produce learned predictor
            s = np.linspace(xmin,xmax,400)
            t = [self.tree_predict(np.asarray([v]),w) for v in s]

            # plot approximation and data in panel
            ax1.scatter(self.x,self.y,c = 'k',edgecolor = 'w',s = 60,zorder = 2)
            ax1.plot(s,t,linewidth = 2.5,color = self.colors[0],zorder = 0)
            
            # plot horizontal axis and dashed line to split point
            #ax1.axhline(c = 'k',linewidth = 1 ,zorder = 0) 
            mid = (self.levels[k][0] + self.levels[k][1])/float(2)
            o = np.linspace(ymin,ymax,100)
            e = np.ones((100,1))
            sp = self.splits[k]
            ax1.plot(sp*e,o,linewidth = 1.5,color = self.colors[1], linestyle = '--',zorder = 1)
                
            # cleanup panel
            ax1.set_xlim([xmin,xmax])
            ax1.set_ylim([ymin,ymax])
            ax1.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
            ax1.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
            ax1.set_xticks(np.arange(round(xmin), round(xmax)+1, 1.0))
            ax1.set_yticks(np.arange(round(ymin), round(ymax)+1, 1.0))
            
            ### corresponding balanced accuracy values ###
            # compute predictions given stump
            ax2.scatter(self.splits[k],self.vals[k],color = self.colors[1],marker='x',s=60,edgecolors='k',linewidth=2)
            ax2.set_xlim([xmin,xmax])
            ax2.set_ylim([0,1])
            ax2.set_xticks(np.arange(round(xmin), round(xmax)+1, 1.0))
            ax2.set_xlabel(r'$split$', fontsize = 12,labelpad = 10)
            ax2.set_ylabel(r'$cost$', rotation = 90,fontsize = 12,labelpad = 10)

        anim = animation.FuncAnimation(fig, animate,frames = self.num_elements, interval = self.num_elements, blit=True)
        
        return(anim)

 

 