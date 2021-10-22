# import standard plotting and animation
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
import autograd.numpy as np
from matplotlib import gridspec
import copy
from . import old_optimimzers as opts

'''
tarball of simple demos for nonlinear supervised learning part 2
'''
class Visualizer():
    def __init__(self,csvname):
        # grab input
        data = np.loadtxt(csvname,delimiter = ',')
        self.x = data[:,:-1]
        self.y = data[:,-1]
        self.x.shape = (len(self.x),1)
        self.y.shape = (len(self.y),1)

    # define these functions in python
    def f_1(self,x):
        return x

    def f_2(self,x):
        return x**2

    def f_3(self,x):
        return np.sinc(10*x + 1)

    def f_4(self,x):
        return x**3

    # define prediction
    def predict1(self,x,w):
        return w[0] + w[1]*self.f_1(x)

    # define prediction
    def predict2(self,x,w):
        return w[0] + w[1]*self.f_1(x) + w[2]*self.f_2(x)

    # define prediction
    def predict3(self,x,w):
        return w[0] + w[1]*self.f_1(x) + w[2]*self.f_2(x) + w[3]*self.f_3(x)

    # define prediction
    def predict4(self,x,w):
        return w[0] + w[1]*self.f_1(x) + w[2]*self.f_2(x) + w[3]*self.f_4(x)

    # least squares
    def least_squares(self,w):
        cost = 0
        for p in range(0,len(self.y)):
            x_p = self.x[p]
            y_p = self.y[p]
            cost +=(self.predict(x_p,w) - y_p)**2
        return cost[0]

    # plotting functions
    def plot_feats(self,version):
        s = np.linspace(-4,4,300)

        # initialize figure
        fig = plt.figure(figsize = (9,3))
        gs = gridspec.GridSpec(1, 3,width_ratios = [1,1,1]) 

        # setup current axis
        ax1 = plt.subplot(gs[0]);
        ax2 = plt.subplot(gs[1]);
        ax3 = plt.subplot(gs[2]);

        # compute each feature
        t1 = self.f_1(s)
        t2 = self.f_2(s)
        t3 = self.f_3(s)
        if version == 2:
            t3 = self.f_4(s)

        # plot fits
        for ax in {ax1,ax2,ax3}:
            title = ''
            if ax == ax1:
                ax.plot(s,t1,c = 'lime',linewidth = 2,zorder = 3)
                title = r'$f_1(x)$'
            if ax == ax2:
                ax.plot(s,t2,c = 'lime',linewidth = 2,zorder = 3)
                title = r'$f_2(x)$'
            if ax == ax3:
                ax.plot(s,t3,c = 'lime',linewidth = 2,zorder = 3)
                title = r'$f_3(x)$'

            ## cleanup plot
            ax.set_title(title,fontsize = 12)

            # setup plot
            ax.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
            ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)

            # clean up plot
            ax.grid(True, which='both')
            ax.axhline(y=0, color='k')
            ax.axvline(x=0, color='k')

    # scatter point functions
    def show_pts(self):
        # initialize figure
        fig = plt.figure(figsize = (9,3))
        gs = gridspec.GridSpec(1, 3,width_ratios = [1,2,1]) 
        ax = plt.subplot(gs[1]);

        # set plotting limits
        xmax = copy.deepcopy(max(self.x))
        xmin = copy.deepcopy(min(self.x))
        xgap = (xmax - xmin)*0.2
        xmin -= xgap
        xmax += xgap

        ymax = copy.deepcopy(max(self.y))
        ymin = copy.deepcopy(min(self.y))
        ygap = (ymax - ymin)*0.2
        ymin -= ygap
        ymax += ygap    

        # initialize points
        ax.scatter(self.x,self.y,color = 'k', edgecolor = 'w',linewidth = 0.9,s = 40)

        # clean up panel
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])

    # scatter points
    def scatter_pts(self,ax):    
        # set plotting limits
        xmax = copy.deepcopy(max(self.x))
        xmin = copy.deepcopy(min(self.x))
        xgap = (xmax - xmin)*0.2
        xmin -= xgap
        xmax += xgap

        ymax = copy.deepcopy(max(self.y))
        ymin = copy.deepcopy(min(self.y))
        ygap = (ymax - ymin)*0.2
        ymin -= ygap
        ymax += ygap    

        # initialize points
        ax.scatter(self.x,self.y,color = 'k', edgecolor = 'w',linewidth = 0.9,s = 40)

        # clean up panel
        ax.set_xlim([xmin,xmax])
        ax.set_ylim([ymin,ymax])

    # running function
    def show_fits(self,version):
        # initialize figure
        fig = plt.figure(figsize = (9,3))
        gs = gridspec.GridSpec(1, 3,width_ratios = [1,1,1]) 
        ax1 = plt.subplot(gs[0]);
        ax2 = plt.subplot(gs[1]);
        ax3 = plt.subplot(gs[2]);

        # initialize optimizer
        opt = opts.MyOptimizers()
        
        for ax in {ax1,ax2,ax3}:
            # scatter points
            self.scatter_pts(ax)
            
            if ax == ax1:
                self.predict = self.predict1
                w_init = np.random.randn(2,1)
                title = r'$w_0 + w_1\,f_1(x)$'
            if ax == ax2:
                self.predict = self.predict2
                w_init = np.random.randn(3,1)
                title = r'$w_0 + w_1\,f_1(x) + w_2\,f_2(x)$'
            if ax == ax3 and version == 1:
                self.predict = self.predict3
                w_init = np.random.randn(4,1)
                title = r'$w_0 + w_1\,f_1(x) + w_2\,f_2(x) + w_3\,f_3(x)$'
            if ax == ax3 and version == 2:
                self.predict = self.predict4
                w_init = np.random.randn(4,1)
                title = r'$w_0 + w_1\,f_1(x) + w_2\,f_2(x) + w_3\,f_3(x)$'              

            # run optimization
            w_hist = opt.newtons_method(g = self.least_squares,win = w_init,max_its = 1,verbose = False)
            w = w_hist[-1]

            # create fit
            gapx = (max(self.x) - min(self.x))*0.1
            s = np.linspace(min(self.x) - gapx,max(self.x) + gapx,300)
            t = [self.predict(np.asarray([v]),w) for v in s]
            ax.plot(s,t,c = 'lime',zorder = 3,linewidth = 3)

            # clean panel
            ax.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
            ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
            ax.set_title(title,fontsize = 10)