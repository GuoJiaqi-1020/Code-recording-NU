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
    def __init__(self, csvname):
        # grab input
        data = np.loadtxt(csvname, delimiter=',')
        self.x = data[:-1, :]
        self.y = data[-1:, :]

        self.colors = ['salmon', 'cornflowerblue', 'lime', 'bisque', 'mediumaquamarine', 'b', 'm', 'g']
        self.plot_colors = ['lime', 'violet', 'orange', 'b', 'r', 'darkorange', 'lightcoral', 'chartreuse', 'aqua',
                            'deeppink']

    ########## show boosting crossval on 1d regression, with fit to residual ##########
    def show_runs(self, best_runs, **kwargs):
        ### setup figure and plotting grid ###
        fig = plt.figure(1, figsize=(9, 8))
        gridspec.GridSpec(6, 5, wspace=0.0, hspace=0.0)

        # create tuples for mapping plots to axes
        blocks = []
        if len(best_runs) > 5:
            for i in range(5):
                for j in range(2):
                    blocks.append(tuple((i, j)))
        else:
            for i in range(5):
                blocks.append(tuple((i, 0)))

        all_fits = []
        self.univ_ind = 0
        for k in range(len(best_runs)):
            # select axis for individual plot
            run = best_runs[k]
            ax = plt.subplot2grid((6, 5), blocks[k])
            # ax.axis('equal')

            # pluck out current weights           
            self.draw_fit_trainval(ax, run)

            # turn off ticks and labels
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)

            self.univ_ind += 1
        # ax.axis('equal')

        # plot all models and ave
        ax = plt.subplot2grid((6, 5), (1, 2), colspan=4, rowspan=3)

        if len(best_runs) <= 5:
            ax = plt.subplot2grid((6, 5), (1, 1), colspan=3, rowspan=3)

        # plot all models and ave
        plt.setp(ax.get_yticklabels(), visible=False)
        ax.yaxis.set_tick_params(size=0)
        ax.yaxis.tick_left()
        plt.setp(ax.get_xticklabels(), visible=False)
        ax.xaxis.set_tick_params(size=0)

        self.draw_models(ax, best_runs)
        plt.show()
        # ax.axis('equal')

    def draw_fused_model(self, ax, runs):
        # get visual boundary
        xmin1 = np.min(self.x[0, :])
        xmax1 = np.max(self.x[0, :])
        xgap1 = (xmax1 - xmin1) * 0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = np.min(self.x[1, :])
        xmax2 = np.max(self.x[1, :])
        xgap2 = (xmax2 - xmin2) * 0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        # plot data
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(self.x[0, ind0], self.x[1, ind0], s=60, color=self.colors[0], edgecolor='k', linewidth=1, zorder=3)

        ind1 = np.argwhere(self.y == -1)
        ind1 = [v[1] for v in ind1]
        ax.scatter(self.x[0, ind1], self.x[1, ind1], s=60, color=self.colors[1], edgecolor='k', linewidth=1, zorder=3)

        ### clean up panels ###
        ax.set_xlim([xmin1, xmax1])
        ax.set_ylim([xmin2, xmax2])

        # label axes
        # ax.set_xlabel(r'$x_1$', fontsize = 14)
        # ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 10)

        # plot boundary for 2d plot
        s1 = np.linspace(xmin1, xmax1, 50)
        s2 = np.linspace(xmin2, xmax2, 50)
        a, b = np.meshgrid(s1, s2)
        a = np.reshape(a, (np.size(a), 1))
        b = np.reshape(b, (np.size(b), 1))
        h = np.concatenate((a, b), axis=1)
        a.shape = (np.size(s1), np.size(s2))
        b.shape = (np.size(s1), np.size(s2))

        # plot fit on residual
        t_ave = []
        for k in range(len(runs)):
            # get current run
            tree = runs[k]

            depth = tree.best_depth
            t = []
            for val in h:
                val = val[:, np.newaxis]
                out = tree.evaluate_tree(val, depth)
                t.append(out)
            t = np.array(t)

            # reshape it
            t.shape = (np.size(s1), np.size(s2))

            #### plot contour, color regions ####
            col = np.random.rand(1, 3)
            # ax.contour(s1,s2,t, linewidths=2.5,levels = [0],colors = self.plot_colors[k],zorder = 2,alpha = 0.4)
            t_ave.append(t)
        t_ave = np.array(t_ave)
        t_ave1 = np.median(t_ave, axis=0)
        ax.contour(s1, s2, t_ave1, linewidths=3.5, levels=[0], colors='k', zorder=4, alpha=1)
################################################
    def draw_models(self, ax, runs):
        # get visual boundary
        xmin1 = np.min(self.x[0, :])
        xmax1 = np.max(self.x[0, :])
        xgap1 = (xmax1 - xmin1) * 0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = np.min(self.x[1, :])
        xmax2 = np.max(self.x[1, :])
        xgap2 = (xmax2 - xmin2) * 0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        # plot data
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(self.x[0, ind0], self.x[1, ind0], s=60, color=self.colors[0], edgecolor='k', linewidth=1, zorder=3)

        ind1 = np.argwhere(self.y == -1)
        ind1 = [v[1] for v in ind1]
        ax.scatter(self.x[0, ind1], self.x[1, ind1], s=60, color=self.colors[1], edgecolor='k', linewidth=1, zorder=3)

        ### clean up panels ###             
        ax.set_xlim([xmin1, xmax1])
        ax.set_ylim([xmin2, xmax2])

        # label axes
        # ax.set_xlabel(r'$x_1$', fontsize = 14)
        # ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 10)

        # plot boundary for 2d plot
        s1 = np.linspace(xmin1, xmax1, 50)
        s2 = np.linspace(xmin2, xmax2, 50)
        a, b = np.meshgrid(s1, s2)
        a = np.reshape(a, (np.size(a), 1))
        b = np.reshape(b, (np.size(b), 1))
        h = np.concatenate((a, b), axis=1)
        a.shape = (np.size(s1), np.size(s2))
        b.shape = (np.size(s1), np.size(s2))

        # plot fit on residual
        t_ave = []
        for k in range(len(runs)):
            # get current run
            tree = runs[k]

            depth = tree.best_depth
            t = []
            for val in h:
                val = val[:, np.newaxis]
                out = tree.evaluate_tree(val, depth)
                t.append(out)
            t = np.array(t)

            # reshape it
            t.shape = (np.size(s1), np.size(s2))

            #### plot contour, color regions ####
            col = np.random.rand(1, 3)
            # ax.contour(s1,s2,t, linewidths=2.5,levels = [0],colors = self.plot_colors[k],zorder = 2,alpha = 0.4)
            t_ave.append(t)
        t_ave = np.array(t_ave)
        t_ave1 = np.median(t_ave, axis=0)
        ax.contour(s1, s2, t_ave1, linewidths=3.5, levels=[0], colors='k', zorder=4, alpha=1)
###################################################

    def draw_fit_trainval(self, ax, tree):
        # get visual boundary
        xmin1 = np.min(copy.deepcopy(self.x[0, :]))
        xmax1 = np.max(copy.deepcopy(self.x[0, :]))
        xgap1 = (xmax1 - xmin1) * 0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = np.min(copy.deepcopy(self.x[1, :]))
        xmax2 = np.max(copy.deepcopy(self.x[1, :]))
        xgap2 = (xmax2 - xmin2) * 0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        ####### plot total model on original dataset #######
        # scatter original data - training and validation sets
        train_inds = tree.train_inds
        valid_inds = tree.valid_inds

        x_train = self.x[:, train_inds]
        y_train = self.y[:, train_inds]
        x_valid = self.x[:, valid_inds]
        y_valid = self.y[:, valid_inds]

        # plot data  
        ind0 = np.argwhere(y_train == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_train[0, ind0], x_train[1, ind0], s=20, color=self.colors[0], edgecolor='k', linewidth=1, zorder=3)

        ind0 = np.argwhere(y_valid == +1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_valid[0, ind0], x_valid[1, ind0], s=20, color=self.colors[0], edgecolor=[1, 0.8, 0.5], linewidth=1,
                   zorder=3)

        ind0 = np.argwhere(y_train == -1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_train[0, ind0], x_train[1, ind0], s=20, color=self.colors[1], edgecolor='k', linewidth=1, zorder=3)

        ind0 = np.argwhere(y_valid == -1)
        ind0 = [v[1] for v in ind0]
        ax.scatter(x_valid[0, ind0], x_valid[1, ind0], s=20, color=self.colors[1], edgecolor=[1, 0.8, 0.5], linewidth=1,
                   zorder=3)

        # plot boundary for 2d plot
        s1 = np.linspace(xmin1, xmax1, 50)
        s2 = np.linspace(xmin2, xmax2, 50)
        a, b = np.meshgrid(s1, s2)
        a = np.reshape(a, (np.size(a), 1))
        b = np.reshape(b, (np.size(b), 1))
        h = np.concatenate((a, b), axis=1)
        a.shape = (np.size(s1), np.size(s2))
        b.shape = (np.size(s1), np.size(s2))

        depth = tree.best_depth
        t = []
        for val in h:
            val = val[:, np.newaxis]
            out = tree.evaluate_tree(val, depth)
            t.append(out)
        t = np.array(t)

        # reshape it
        t.shape = (np.size(s1), np.size(s2))

        #### plot contour, color regions ####
        col = np.random.rand(1, 3)
        ax.contour(s1, s2, t, linewidths=2.5, levels=[0], colors='k', alpha=1, zorder=5)
        ax.contour(s1, s2, t, linewidths=1.5, levels=[0], colors=self.plot_colors[self.univ_ind], alpha=1, zorder=5)

        ### clean up panels ###             
        ax.set_xlim([xmin1, xmax1])
        ax.set_ylim([xmin2, xmax2])

        # label axes
        # ax.set_xlabel(r'$x_1$', fontsize = 14)
        # ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)

    def show_baggs(self, runs, **kwargs):
        color_region = False
        if 'color_region' in kwargs:
            color_region = kwargs['color_region']

        fig, axs = plt.subplots(figsize=(10, 3), ncols=3)

        # get visual boundary
        xmin1 = np.min(self.x[0, :])
        xmax1 = np.max(self.x[0, :])
        xgap1 = (xmax1 - xmin1) * 0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = np.min(self.x[1, :])
        xmax2 = np.max(self.x[1, :])
        xgap2 = (xmax2 - xmin2) * 0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        ####### plot total model on original dataset #######
        # scatter original data - training and validation sets
        ax1 = axs[0]
        ax2 = axs[1]
        ax3 = axs[2]

        # plot data
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        ax1.scatter(self.x[0, ind0], self.x[1, ind0], s=45, color=self.colors[0], edgecolor='k', linewidth=1, zorder=3)
        ax2.scatter(self.x[0, ind0], self.x[1, ind0], s=45, color=self.colors[0], edgecolor='k', linewidth=1, zorder=3)
        ax3.scatter(self.x[0, ind0], self.x[1, ind0], s=45, color=self.colors[0], edgecolor='k', linewidth=1, zorder=3)

        ind1 = np.argwhere(self.y == -1)
        ind1 = [v[1] for v in ind1]
        ax1.scatter(self.x[0, ind1], self.x[1, ind1], s=45, color=self.colors[1], edgecolor='k', linewidth=1, zorder=3)
        ax2.scatter(self.x[0, ind1], self.x[1, ind1], s=45, color=self.colors[1], edgecolor='k', linewidth=1, zorder=3)
        ax3.scatter(self.x[0, ind1], self.x[1, ind1], s=45, color=self.colors[1], edgecolor='k', linewidth=1, zorder=3)

        ### clean up panels ###             
        ax1.set_xlim([xmin1, xmax1])
        ax2.set_xlim([xmin1, xmax1])
        ax3.set_xlim([xmin1, xmax1])

        ax1.set_ylim([xmin2, xmax2])
        ax2.set_ylim([xmin2, xmax2])
        ax3.set_xlim([xmin1, xmax1])

        # turn off ticks and labels
        for ax in [ax1, ax2, ax3]:
            plt.setp(ax.get_yticklabels(), visible=False)
            ax.yaxis.set_tick_params(size=0)
            ax.yaxis.tick_left()
            plt.setp(ax.get_xticklabels(), visible=False)
            ax.xaxis.set_tick_params(size=0)

        # label axes
        # ax.set_xlabel(r'$x_1$', fontsize = 14)
        # ax.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)
        # ax1.set_xlabel(r'$x_1$', fontsize = 14)
        # ax1.set_ylabel(r'$x_2$', rotation = 0,fontsize = 14,labelpad = 15)

        ax1.set_title('data')
        ax2.set_title('individual models')
        ax3.set_title('modal model')

        # plot boundary for 2d plot
        s1 = np.linspace(xmin1, xmax1, 50)
        s2 = np.linspace(xmin2, xmax2, 50)
        a, b = np.meshgrid(s1, s2)
        a = np.reshape(a, (np.size(a), 1))
        b = np.reshape(b, (np.size(b), 1))
        h = np.concatenate((a, b), axis=1)
        a.shape = (np.size(s1), np.size(s2))
        b.shape = (np.size(s1), np.size(s2))

        # plot fit on residual
        t_ave = []
        for k in range(len(runs)):
            # get current run
            run = runs[k]
            cost = run.cost
            model = run.model
            feat = run.feature_transforms
            normalizer = run.normalizer
            w = run.weight_histories

            # get best weights                
            o = model(normalizer(h.T), w)
            t = np.sign(o)

            # reshape it
            t.shape = (np.size(s1), np.size(s2))

            #### plot contour, color regions ####    
            for ax in [ax2]:
                ax.contour(a, b, t, linewidths=2.5, levels=[0], colors='k', alpha=1, zorder=5)
                ax.contour(a, b, t, linewidths=1.5, levels=[0], colors=self.plot_colors[k], alpha=1, zorder=5)

            t_ave.append(t)

        t_ave = np.array(t_ave)
        t_ave1 = np.median(t_ave, axis=0)
        ax3.contour(a, b, t_ave1, linewidths=3.5, levels=[0], colors='k', zorder=4, alpha=1)

        if color_region == True:
            ax3.contourf(a, b, t_ave1, colors=[self.colors[1], self.colors[0]], alpha=0.2, levels=range(-1, 2))
