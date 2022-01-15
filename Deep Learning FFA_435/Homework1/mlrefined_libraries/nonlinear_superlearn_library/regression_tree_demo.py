# import standard libs
import copy
import numpy as np

# import standard plotting 
import matplotlib.pyplot as plt
from matplotlib import gridspec
from IPython.display import clear_output
from mpl_toolkits.mplot3d import proj3d
from mpl_toolkits.mplot3d.proj3d import proj_transform

class Visualizer:
    def __init__(self,csvname):
        # load data
        data = np.loadtxt(csvname,delimiter = ',')

        # load input/output data
        self.x = data[:-1,:]
        self.y = data[-1:,:] 

    # create step function
    def step(self,x,w):
        dim = 0
        return np.array([(w[1] if v <= w[0] else w[2]) for v in x[dim,:]]).T

    # an implementation of the least squares cost function for linear regression
    def least_squares(self,w,x,y):
        # compute cost
        cost = np.sum((self.step(x,w) - y)**2)
        return cost/float(np.size(y))

    def multistump_plotter(self):
        x = self.x
        y = self.y
        colors = ['r','lime','blue']

        # figure
        fig = plt.figure(figsize = (6,9))

        # both a surface and contour plot in the same figure
        gs = gridspec.GridSpec(3, 2) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off')
        ax2 = plt.subplot(gs[1]); ax2.axis('off')
        ax3 = plt.subplot(gs[2]); ax3.axis('off')                 
        ax4 = plt.subplot(gs[3]); ax4.axis('off')
        ax5 = plt.subplot(gs[4]); ax5.axis('off')
        ax6 = plt.subplot(gs[5]); ax6.axis('off')

        ### scatter data
        ax1.scatter(x,y,c='k',edgecolor = 'w',s=60,linewidth=1)

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

        ### draw cost in terms of split for various levels
        for i in range(3):
            w = np.zeros((3,1))

            if i == 2:
                w[1] = 1
                w[-1] = -1
            if i == 1:
                w[1] = 0.4
                w[-1] = -0.7
            if i == 0:
                w[1] = -0.5
                w[-1] = 0.5

            s = np.linspace(xmin,xmax,500)
            t = []
            for split in s:
                w[0] = split
                val = self.least_squares(w,x,y)
                t.append(val)
            t = np.array(t)[np.newaxis,:]
            ax3.plot(s.T,t.T,linewidth= 2,c = colors[i])

            # plot best step on data
            ind = np.argmin(t)
            w[0] = s[ind]
            w[0] = 0.25*(i+1)
            best_split = s[ind]
            vals = self.step(s[np.newaxis,:],w)
            ax2.plot(s[np.newaxis,:].T,vals.T,c=colors[i],linewidth=2.5,zorder = 0)
            
            # plot midpoints
            for j in range(np.size(y) - 1):
                w[0] = x[:,j] + (x[:,j+1] - x[:,j])/float(2)
                v_mid = self.least_squares(w,x,y)
                #ax5.scatter(w[0],v_mid,c='k',marker='x',s=30)
                ax5.scatter(w[0],v_mid,c=colors[i],marker='x',s=60,edgecolors='k',linewidth=2)

        # clean panels
        ax1.set_ylim([ymin,ymax])
        ax2.set_ylim([ymin,ymax])

        ax1.set_xlim([xmin,xmax])
        ax2.set_xlim([xmin,xmax])
        ax3.set_xlim([xmin,xmax])
        ax5.set_xlim([xmin,xmax])
        
    # best plotter
    def best_plotter(self):
        x = self.x
        y = self.y
        colors = [[1,0,0.4], [ 0, 0.4, 1],[0, 1, 0.5],[1, 0.7, 0.5],[0.7, 0.6, 0.5],'mediumaquamarine']

        # figure
        fig = plt.figure(figsize = (9,3))

        # both a surface and contour plot in the same figure
        gs = gridspec.GridSpec(1, 3) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off')
        ax2 = plt.subplot(gs[1]); ax2.axis('off')
        ax3 = plt.subplot(gs[2],projection='3d'); ax3.axis('off')

        ### scatter data
        ax1.scatter(x,y,c='k',edgecolor = 'w',s=60,linewidth=1)
        ax2.scatter(x,y,c='k',edgecolor = 'w',s=60,linewidth=1)

        ### draw cost in terms of split point
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

        ax1.set_ylim([ymin,ymax])
        ax2.set_ylim([ymin,ymax])
        ax1.set_xlim([xmin,xmax])
        ax2.set_xlim([xmin,xmax])

        w = np.zeros((3,1))
        w[1] = 1*0.2
        w[-1] = -1*0.2

        s = np.linspace(xmin,xmax,500)
        t = []
        for split in s:
            w[0] = split
            val = self.least_squares(w,x,y)
            t.append(val)
        t = np.array(t)[np.newaxis,:]
        ind = np.argmin(t)

        # plot best step on data
        ind = np.argmin(t)
        w[0] = s[ind]
        best_split = x[:,4] + (x[:,5] - x[:,4])/2

        o = np.linspace(-1.2,1.2,100)
        e = np.ones((100,1))

        ax1.plot(best_split*e,o,linewidth = 1.5,color = colors[1], linestyle = '--',zorder = 1)

        # plot 3d mesh of cost function over leaf values
        #### define input space for function and evaluate ####
        w1 = np.linspace(-2,2,200)
        w2 = np.linspace(-2,2,200)
        w1_vals, w2_vals = np.meshgrid(w1,w2)
        w1_vals.shape = (len(w1)**2,1)
        w2_vals.shape = (len(w2)**2,1)
        h = np.concatenate((w1_vals,w2_vals),axis=1)
        new_step = lambda x,w,split=best_split,dim=0: np.array([(w[0] if v <= split else w[1]) for v in x[dim,:]]).T
        cost = np.array([np.sum((new_step(x,yo) - y)**2)/np.float(np.size(y)) for yo in h])
        ind2 = np.argmin(cost)
        sin = w1_vals[ind2]
        tin = w2_vals[ind2]
        cin = cost[ind2]

        ### plot function as surface ### 
        w1_vals.shape = (len(w1),len(w2))
        w2_vals.shape = (len(w1),len(w2))
        cost.shape = (len(w1),len(w2))
        ax3.plot_surface(w1_vals, w2_vals, cost, alpha = 0.4,color = 'w',rstride=25, cstride=25,linewidth=1,edgecolor = 'k',zorder = 2)

        # plot minimal point
        ax3.scatter(sin,tin,cin,c = colors[0])

        w_best = np.array([best_split,sin,tin])
        vals = self.step(s[np.newaxis,:],w_best)

        ax2.plot(s[np.newaxis,:].T,vals.T,c=colors[0],linewidth=2.5,zorder = 0)

        # clean up axis
        ax3.xaxis.pane.fill = False
        ax3.yaxis.pane.fill = False
        ax3.zaxis.pane.fill = False

        ax3.xaxis.pane.set_edgecolor('white')
        ax3.yaxis.pane.set_edgecolor('white')
        ax3.zaxis.pane.set_edgecolor('white')