# import standard libs
import copy
import numpy as np

# import standard plotting 
import matplotlib.pyplot as plt
from matplotlib import gridspec

class Visualizer:
    def __init__(self,csvname):
        # load data
        data = np.loadtxt(csvname,delimiter = ',')

        # load input/output data
        self.x = data[:-1,:]
        self.y = data[-1:,:]
        
        self.colors = [[1,0,0.4],[ 0, 0.4, 1]]

        
    def plot_original(self):
        # locals
        x = self.x
        y = self.y
        
        # set viewing range
        xmin = np.min(copy.deepcopy(x.flatten()))
        xmax = np.max(copy.deepcopy(x.flatten()))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap

        ymin = np.min(copy.deepcopy(y.flatten()))
        ymax = np.max(copy.deepcopy(y.flatten()))
        ygap = (ymax - ymin)*0.1
        ymin -= ygap
        ymax += ygap
        
        # figure
        fig = plt.figure(figsize = (9,3))

        # both a surface and contour plot in the same figure
        gs = gridspec.GridSpec(1, 2, width_ratios=[1,1]) 
        ax1 = plt.subplot(gs[0]);
        ax2 = plt.subplot(gs[1]);
             
        # scatter
        for ax in [ax1,ax2]:
            ax.scatter(x,y,c='k',edgecolor = 'w',s=50,linewidth=1,zorder = 3)

            # clean up panels
            ax.set_xlim([xmin,xmax])
            ax.set_ylim([ymin,ymax])
            ax.set_xlabel(r'$x$')
            ax.set_ylabel(r'$y$',rotation = 0)
        
        # paint midpoint lines in second panel
        P = y.size
        for p in range(P - 1):
            ### compute split point
            split = (x[:,p] + x[:,p+1])/float(2)
            o = np.linspace(ymin,ymax,100)
            e = np.ones((100,1))
            sp = split
            ax2.plot(sp*e,o,linewidth = 1.5,color = self.colors[1], linestyle = '--',zorder = 1)

            
        # create stump
        s = np.linspace(xmin,xmax,400)[np.newaxis,:]
        step = lambda x,split=split,left_ave=-1,right_ave=-1,dim=0: np.array([(left_ave if v <= split else right_ave) for v in x[dim,:]])
        t = np.array([step(v[np.newaxis,:]) for v in s.T]).T

        ### plot step
        ax2.plot(s.T,t.T,linewidth= 2,c = self.colors[0],zorder = 0)
            
            
    # create step function
    def step(self,x,w):
        return np.array([(w[1] if v <= w[0] else w[2]) for v in x[0,:]]).T

    # plot original data and stumps whose leaf values are set by weighted majority 
    def multistump_plotter(self):
        x = self.x
        y = self.y
        
        # set viewing range
        xmin = np.min(copy.deepcopy(x.flatten()))
        xmax = np.max(copy.deepcopy(x.flatten()))
        xgap = (xmax - xmin)*0.1
        xmin -= xgap
        xmax += xgap

        ymin = np.min(copy.deepcopy(y.flatten()))
        ymax = np.max(copy.deepcopy(y.flatten()))
        ygap = (ymax - ymin)*0.1
        ymin -= ygap
        ymax += ygap

        # figure
        fig = plt.figure(figsize = (9,6))

        # both a surface and contour plot in the same figure
        gs = gridspec.GridSpec(3, 3) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off')
        ax2 = plt.subplot(gs[1]); ax2.axis('off')
        ax3 = plt.subplot(gs[2]); ax3.axis('off')  
        
        ax4 = plt.subplot(gs[3]); ax4.axis('off')
        ax5 = plt.subplot(gs[4]); ax5.axis('off')
        ax6 = plt.subplot(gs[5]); ax6.axis('off')
        
        ax7 = plt.subplot(gs[6]); ax7.axis('off')
        ax8 = plt.subplot(gs[7]); ax8.axis('off')
        ax9 = plt.subplot(gs[8]); ax9.axis('off')

        # scatter data in appropriate panels
        for ax in [ax1,ax2,ax3,ax4,ax5,ax6,ax7,ax8,ax9]:
            # scatter
            ax.scatter(x,y,c='k',edgecolor = 'w',s=50,linewidth=1,zorder = 3)
            
            # clean up panels
            ax.set_xlim([xmin,xmax])
            ax.set_ylim([ymin,ymax])

        ### derive and draw stump ###
        axs = [ax1,ax2,ax3,ax4,ax5,ax6,ax7,ax8,ax9]
        P = y.size
        c_vals,c_counts = np.unique(y,return_counts = True) 
        s = np.linspace(xmin,xmax,400)[np.newaxis,:]
        for p in range(P - 1):
            ### compute split point
            split = (x[:,p] + x[:,p+1])/float(2)
            
            ### compute leaf values
            # compute various counts and decide on levels
            c_left_vals,c_left_counts = np.unique(y[:,:p+1],return_counts = True) 
            c_right_vals,c_right_counts = np.unique(y[:,p+1:],return_counts = True) 

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

            ### array it
            prop_left = np.array(prop_left)
            best_left = np.argmax(prop_left)
            left_ave = c_vals[best_left]

            prop_right = np.array(prop_right)
            best_right = np.argmax(prop_right)
            right_ave = c_vals[best_right]
                    
            # create stump
            step = lambda x,split=split,left_ave=left_ave,right_ave=right_ave,dim=0: np.array([(left_ave if v <= split else right_ave) for v in x[dim,:]])
            t = np.array([step(v[np.newaxis,:]) for v in s.T]).T
    
            ### plot step
            ax = axs[p]
            ax.plot(s.T,t.T,linewidth= 2,c = self.colors[0],zorder = 0)
            
            ### plot visualizer for split
            if left_ave == right_ave:
                o = np.linspace(ymin,ymax,100)
                e = np.ones((100,1))
                sp = split
                ax.plot(sp*e,o,linewidth = 1.5,color = self.colors[1], linestyle = '--',zorder = 1)