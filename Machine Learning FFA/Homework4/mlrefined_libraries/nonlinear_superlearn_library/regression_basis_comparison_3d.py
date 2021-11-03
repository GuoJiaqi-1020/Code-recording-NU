# import standard plotting and animation
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from mpl_toolkits.mplot3d import Axes3D
from IPython.display import clear_output
from matplotlib import gridspec
import autograd.numpy as np
from mlrefined_libraries.JSAnimation_slider_only import IPython_display_slider_only
from . import old_optimimzers as optimimzers
import copy
import time
import bisect


class Visualizer:
    '''
    Class for visualizing nonlinear regression fits to N = 1 dimensional input datasets
    '''

    # load target function
    def load_data(self,csvname):
        data = np.loadtxt(csvname,delimiter = ',')
        self.x = data[:,:-1]
        self.y = data[:,-1]
        self.y.shape = (len(self.y),1)
        
    # initialize after animation call
    def dial_settings(self):
        self.colors = [[1,0,0.4], [ 0, 0.4, 1],[0, 1, 0.5],[1, 0.7, 0.5],[0.7, 0.6, 0.5],'mediumaquamarine']

        #### create degree set for polys ####
        e = 0
        self.degs = []
        while e < self.num_elements + 1:
            for i in range(0,self.num_elements):
                for j in range(0,i+1):
                    dg1 = i
                    dg2 = j
                    self.degs.append([dg1,dg2]) 
                    e+=1
                
        # generate poly features
        self.F_poly = self.poly_feats(self.num_elements + 1)

        
        #### random weights for tanh network, tanh transform ####
        scale = 1
        self.R = scale*np.random.randn(self.num_elements+1,3)
        self.F_tanh = self.tanh_feats(self.num_elements+1)
       
        #### initialize split points for trees ####
        splits = []
        levels = []
        dims = []
        residual = copy.deepcopy(self.y)

        ## create simple 'weak learner' between each consecutive pair of points ##
        for j in range(0,2):
            # sort data by values of input in each dimension
            x_t = copy.deepcopy(self.x)
            y_t = copy.deepcopy(self.y)
            sorted_inds = np.argsort(x_t[:,j],axis = 0)
            x_t = x_t[sorted_inds]
            y_t = y_t[sorted_inds]

            # loop over and create all stumps in this dimension of the input
            for p in range(len(self.y) - 1):
                # determine points on each side of split
                split = (x_t[p,j] + x_t[p+1,j])/float(2)
                splits.append(split)
                dims.append(j)

                # gather points to left and right of split
                pts_left  = [t for t in x_t if t[j] <= split]
                resid_left = residual[:len(pts_left)]
                resid_right = residual[len(pts_left):]

                # compute average on each side
                ave_left = np.mean(resid_left)
                ave_right = np.mean(resid_right)
                levels.append([ave_left,ave_right]) 
                
        # randomize splits for this experiment
        self.orig_splits = splits
        self.orig_levels = levels
        
        r = np.random.permutation(len(self.orig_splits))
        self.orig_splits = [self.orig_splits[v] for v in r]
        self.orig_levels = [self.orig_levels[v] for v in r]
        self.orig_dims = [dims[v] for v in r]
       
        # generate features
        self.F_tree = self.tree_feats()
        
    # least squares
    def least_squares(self,w):
        cost = 0
        for p in range(0,len(self.y)):
            x_p = self.x[p]
            y_p = self.y[p]
            cost +=(self.predict(x_p,w) - y_p)**2
        return cost
    
    ##### transformation functions #####
    # random poly elements of deg < 10    
    def poly_feats(self,D):
        F = []
        for i in range(D):
            deg = self.degs[i]
            f = (self.x[:,0]**deg[0])*(self.x[:,1]**deg[1])  
            f.shape = (len(f),1)
            F.append(f)
        F = np.asarray(F)
        F = F[:, :, 0]
        return F.T
    
    # tanh features    
    def tanh_feats(self,D):
        F = [np.ones((len(self.y),1))]
        for deg in range(D):
            f = np.tanh(self.R[deg,0] + self.R[deg,1]*self.x[:,0] + self.R[deg,2]*self.x[:,1])
            f.shape = (len(f),1)
            F.append(f)
        F = np.asarray(F)
        F = F[:, :, 0]
        return F.T
    
    # stump-tree feats
    def tree_feats(self):
        # feat matrix container
        F = []

        # loop over points and create feature vector based on stump for each
        for pt in self.x:
            f = [1]
            for i in range(len(self.orig_splits)):
                # get current stump
                split = self.orig_splits[i]
                level = self.orig_levels[i]

                # which dimension is the split in?
                dim = self.orig_dims[i]

                # check - which side of this split does the pt lie?
                if pt[dim] <= split:  # lies to the left - so evaluate at left level
                    f.append(level[0])
                else:
                    f.append(level[1])

            # save stump evaluations - this is our feature vector for pt
            F.append(f)
        F = np.asarray(F)
        return F    

    ##### prediction functions #####    
    # prediction
    def poly_predict(self,pt,w):
        # linear combo
        val = w[0] + sum([w[i]*(pt[0]**self.degs[i][0])*(pt[1]**self.degs[i][1]) for i in range(1,self.D)]) 
        return val
    
    # single hidden layer tanh network with fixed random weights
    def tanh_predict(self,pt,w):
        # linear combo
        val = w[0] + sum([w[i]*np.tanh(self.R[i-1,0] + self.R[i-1,1]*pt[0] + self.R[i-1,2]*pt[1])  for i in range(1,self.D)])
        return val

    # tree prediction
    def tree_predict(self,pt,w): 
        # our return prediction
        val = copy.deepcopy(w[0])

        # loop over current stumps and collect weighted evaluation
        for i in range(len(self.splits)):                    
            # which dimension is the split in?
            dim = self.dims[i]

            # get current stump
            split = self.splits[i]
            level = self.levels[i]

            # check - which side of this split does the pt lie?
            if pt[dim] <= split:  # lies to the left - so evaluate at left level
                val += w[i+1]*level[0]
            else:
                val += w[i+1]*level[1]
        return val


    ###### compare all bases ######
    def brows_fits(self,**kwargs):
        # parse input args
        num_elements = [1,10,len(self.y)]
        if 'num_elements' in kwargs:
            num_elements = kwargs['num_elements']
            
        bases = ['poly','net','tree']
        
        # set dials for tanh network and trees
        self.num_elements = max(num_elements)
        self.dial_settings()
        opt = optimimzers.MyOptimizers()
        self.w_t = 0   # weights for tree

        # initialize figure
        fig = plt.figure(figsize = (10,3))
        gs = gridspec.GridSpec(1, len(bases)) 

        # setup current axis
        ax1 = plt.subplot(gs[0],projection = '3d');
        self.move_axis_left(ax1)
        ax2 = plt.subplot(gs[1],projection = '3d');
        self.move_axis_left(ax2)
        ax3 = plt.subplot(gs[2],projection = '3d');
        self.move_axis_left(ax3)

        ### cleanup left plots, create max view ranges ###
        xmin1 = copy.deepcopy(min(self.x[:,0]))
        xmax1 = copy.deepcopy(max(self.x[:,0]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = copy.deepcopy(min(self.x[:,1]))
        xmax2 = copy.deepcopy(max(self.x[:,1]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        ymin = copy.deepcopy(min(self.y))
        ymax = copy.deepcopy(max(self.y))
        ygap = (ymax - ymin)*0.05
        ymin -= ygap
        ymax += ygap
        
        view = [7,60]
        if 'view' in kwargs:
            view = kwargs['view']

        # animate
        print ('beginning animation rendering...')
        def animate(k):
            # clear the panel
            ax1.cla()
            ax2.cla()
            ax3.cla()
            
            # print rendering update
            if np.mod(k+1,5) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(len(num_elements)))
            if k == len(num_elements) - 1:
                print ('animation rendering complete!')
                time.sleep(1)
                clear_output()
            
            # loop over panels, produce plots
            self.D = num_elements[k] + 1
            cs = 0
            for name in bases:
                # fit to data
                ax = 0
                predict = 0
                w = 0
                if name == 'poly':
                    ax = ax1
                    
                    #### initialize poly transform ####
                    F = self.F_poly[:,:self.D]
                    ax.set_title('first ' + str(self.D - 1) + ' poly units',fontsize = 14)
                    self.predict = self.poly_predict

                    #### looks like the most visually interesting overfitting happens with the lstsq solver: solving Fw = y (this is one Newton step)
                    w = np.linalg.lstsq(F, self.y)[0]
                    
                elif name == 'net':
                    ax = ax2
                    F = self.F_tanh[:,:self.D]
                    ax.set_title('first ' + str(self.D - 1) + ' tanh units',fontsize = 14)
                    self.predict = self.tanh_predict
                    
                    #### looks like the most visually interesting overfitting happens with the lstsq solver: solving Fw = y (this is one Newton step)
                    w = np.linalg.lstsq(F, self.y)[0]
                        
                elif name == 'tree':
                    ax = ax3
                    
                    # pick self.D stumps!                    
                    # set predictor
                    self.predict = self.tree_predict

                    # fit tree
                    # reset D for stumps 
                    self.num_trees = min(self.D,len(self.y) - 1) 
                    F = self.F_tree[:,:self.num_trees]
                    self.splits = copy.deepcopy(self.orig_splits[:self.num_trees - 1])
                    self.levels = copy.deepcopy(self.orig_levels[:self.num_trees - 1])
                    self.dims = copy.deepcopy(self.orig_dims[:self.num_trees - 1])
                                             
                    #### looks like the most visually interesting overfitting happens with the lstsq solver: solving Fw = y (this is one Newton step)
                    w = np.linalg.lstsq(F, self.y)[0]
                    ax.set_title('first ' + str(self.num_trees - 1) + ' tree units',fontsize = 14)
                        
                ###### plot all #######
                # set view
                ax.view_init(view[0],view[1])
        
                # scatter original points
                self.scatter_pts(ax,self.x)

                ##### plot surface regression ####
                r1 = np.linspace(xmin1 + xgap1,xmax1 - xgap1,100)
                r2 = np.linspace(xmin2 + xgap2,xmax2 - xgap2,100)
                s,t = np.meshgrid(r1,r2)
                s = np.reshape(s,(np.size(s),1))
                t = np.reshape(t,(np.size(t),1))
                h = np.concatenate((s,t),axis = 1)
                z = []
                for j in range(len(h)):
                    a = self.predict(h[j,:],w)
                    z.append(a)
                z = np.asarray(z)

                # reshape it
                s.shape = (np.size(r1),np.size(r2))
                t.shape = (np.size(r1),np.size(r2))     
                z.shape = (np.size(r1),np.size(r2))

                # plot surface
                ax.plot_surface(s,t,z,alpha = 0.1,color = 'w',rstride=10, cstride=10,linewidth=0.5,edgecolor = 'k')
                
                #######  dress panel ######
                ax.set_xticks(np.arange(round(xmin1), round(xmax1)+1, 1.0))
                ax.set_yticks(np.arange(round(xmin2), round(xmax2)+1, 1.0))
                ax.set_zticks(np.arange(round(ymin[0]), round(ymax[0])+1, 1.0))

                ax.set_xlabel(r'$x_1$',fontsize = 15)
                ax.set_ylabel(r'$x_2$',fontsize = 15)
                ax.set_zlabel(r'$y$',fontsize = 15,rotation = 0)
                
                ax.set_zlim([ymin,ymax])
                ax.set_ylim([xmin2,xmax2])
                ax.set_xlim([xmin1,xmax1])
        
        anim = animation.FuncAnimation(fig, animate,frames = len(num_elements), interval = len(num_elements), blit=True)
        
        return(anim)

    ###### compare all bases ######
    def brows_single_fits(self,**kwargs):
        # parse input args
        num_elements = [1,10,len(self.y)]
        if 'num_elements' in kwargs:
            num_elements = kwargs['num_elements']
            
        basis = 'poly'
        if 'basis' in kwargs:
            basis = kwargs['basis']
        
        # set dials for tanh network and trees
        self.num_elements = max(num_elements)
        self.dial_settings()
        opt = optimimzers.MyOptimizers()
        self.w_t = 0   # weights for tree

        # initialize figure
        fig = plt.figure(figsize = (10,5))
        gs = gridspec.GridSpec(1, 3,width_ratios = [1,3,1]) 

        # setup current axis
        ax1 = plt.subplot(gs[0]); ax1.axis('off')
        ax2 = plt.subplot(gs[1],projection = '3d');
        self.move_axis_left(ax2)
        ax3 = plt.subplot(gs[2]); ax3.axis('off')

        ### cleanup left plots, create max view ranges ###
        xmin1 = copy.deepcopy(min(self.x[:,0]))
        xmax1 = copy.deepcopy(max(self.x[:,0]))
        xgap1 = (xmax1 - xmin1)*0.05
        xmin1 -= xgap1
        xmax1 += xgap1

        xmin2 = copy.deepcopy(min(self.x[:,1]))
        xmax2 = copy.deepcopy(max(self.x[:,1]))
        xgap2 = (xmax2 - xmin2)*0.05
        xmin2 -= xgap2
        xmax2 += xgap2

        ymin = copy.deepcopy(min(self.y))
        ymax = copy.deepcopy(max(self.y))
        ygap = (ymax - ymin)*0.05
        ymin -= ygap
        ymax += ygap
        
        view = [7,60]
        if 'view' in kwargs:
            view = kwargs['view']

        # animate
        print ('beginning animation rendering...')
        def animate(k):
            # clear the panel
            ax2.cla()
            
            # print rendering update
            if np.mod(k+1,5) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(len(num_elements)))
            if k == len(num_elements) - 1:
                print ('animation rendering complete!')
                time.sleep(1)
                clear_output()
            
            # loop over panels, produce plots
            self.D = num_elements[k] + 1
            cs = 0

            # fit to data
            ax = ax2
            predict = 0
            w = 0
            if basis == 'poly':
                    
                #### initialize poly transform ####
                F = self.F_poly[:,:self.D]
                ax.set_title('first ' + str(self.D - 1) + ' poly units',fontsize = 14)
                self.predict = self.poly_predict

                #### looks like the most visually interesting overfitting happens with the lstsq solver: solving Fw = y (this is one Newton step)
                w = np.linalg.lstsq(F, self.y)[0]
                    
            elif basis == 'net':
                F = self.F_tanh[:,:self.D]
                ax.set_title('first ' + str(self.D - 1) + ' tanh units',fontsize = 14)
                self.predict = self.tanh_predict

                #### looks like the most visually interesting overfitting happens with the lstsq solver: solving Fw = y (this is one Newton step)
                w = np.linalg.lstsq(F, self.y)[0]
                        
            elif basis == 'tree':
                    
                # pick self.D stumps!                    
                # set predictor
                self.predict = self.tree_predict

                # fit tree
                # reset D for stumps 
                self.num_trees = min(self.D,len(self.y) - 1) 
                F = self.F_tree[:,:self.num_trees]
                self.splits = copy.deepcopy(self.orig_splits[:self.num_trees - 1])
                self.levels = copy.deepcopy(self.orig_levels[:self.num_trees - 1])
                self.dims = copy.deepcopy(self.orig_dims[:self.num_trees - 1])

                #### looks like the most visually interesting overfitting happens with the lstsq solver: solving Fw = y (this is one Newton step)
                w = np.linalg.lstsq(F, self.y)[0]
                ax.set_title('first ' + str(self.num_trees - 1) + ' tree units',fontsize = 14)

            ###### plot all #######
            # set view
            ax.view_init(view[0],view[1])

            # scatter original points
            self.scatter_pts(ax,self.x)

            ##### plot surface regression ####
            r1 = np.linspace(xmin1 + xgap1,xmax1 - xgap1,100)
            r2 = np.linspace(xmin2 + xgap2,xmax2 - xgap2,100)
            s,t = np.meshgrid(r1,r2)
            s = np.reshape(s,(np.size(s),1))
            t = np.reshape(t,(np.size(t),1))
            h = np.concatenate((s,t),axis = 1)
            z = []
            for j in range(len(h)):
                a = self.predict(h[j,:],w)
                z.append(a)
            z = np.asarray(z)

            # reshape it
            s.shape = (np.size(r1),np.size(r2))
            t.shape = (np.size(r1),np.size(r2))     
            z.shape = (np.size(r1),np.size(r2))

            # plot surface
            ax.plot_surface(s,t,z,alpha = 0.35,color = 'w',rstride=10, cstride=10,linewidth=1,edgecolor = 'k')

            #######  dress panel ######
            ax.set_xticks(np.arange(round(xmin1), round(xmax1)+1, 1.0))
            ax.set_yticks(np.arange(round(xmin2), round(xmax2)+1, 1.0))
            ax.set_zticks(np.arange(round(ymin[0]), round(ymax[0])+1, 1.0))

            ax.set_xlabel(r'$x_1$',fontsize = 15)
            ax.set_ylabel(r'$x_2$',fontsize = 15)
            ax.set_zlabel(r'$y$',fontsize = 15,rotation = 0)

            ax.set_zlim([ymin,ymax])
            ax.set_ylim([xmin2,xmax2])
            ax.set_xlim([xmin1,xmax1])
        
        anim = animation.FuncAnimation(fig, animate,frames = len(num_elements), interval = len(num_elements), blit=True)
        
        return(anim)    
    
    # scatter points
    def scatter_pts(self,ax,x):
        if np.shape(x)[1] <= 1:
            # set plotting limits
            xmax = copy.deepcopy(max(x))
            xmin = copy.deepcopy(min(x))
            xgap = (xmax - xmin)*0.2
            xmin -= xgap
            xmax += xgap
            
            ymax = copy.deepcopy(max(self.y))
            ymin = copy.deepcopy(min(self.y))
            ygap = (ymax - ymin)*0.2
            ymin -= ygap
            ymax += ygap    

            # initialize points
            ax.scatter(x,self.y,color = 'k', edgecolor = 'w',linewidth = 0.9,s = 40)

            # clean up panel
            ax.set_xlim([xmin,xmax])
            ax.set_ylim([ymin,ymax])
            
        if np.shape(x)[1] == 2:
            # initialize points
            ax.scatter(x[:,0],x[:,1],self.y,s = 40,color = 'k', edgecolor = 'w',linewidth = 0.9)
           
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
    def move_axis_left(self,ax):
        tmp_planes = ax.zaxis._PLANES 
        ax.zaxis._PLANES = ( tmp_planes[2], tmp_planes[3], 
                             tmp_planes[0], tmp_planes[1], 
                             tmp_planes[4], tmp_planes[5]) 