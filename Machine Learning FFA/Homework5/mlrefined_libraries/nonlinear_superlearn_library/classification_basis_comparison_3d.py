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
from . import old_optimimzers as optimimzers
import copy

class Visualizer:
    '''
    Compare various basis units on 3d classification
    '''
    #### initialize ####
    def __init__(self,csvname):
        # grab input
        data = np.loadtxt(csvname,delimiter = ',').T
        self.x = data[:,:-1]
        self.y = data[:,-1]
        self.y.shape = (len(self.y),1)
        self.colors = ['salmon','cornflowerblue','lime','bisque','mediumaquamarine','b','m','g']
        
    ######## comprare a single basis type ########
    # initialize after animation call
    def dial_settings(self):
        #### random weights for tanh network, tanh transform ####
        scale = 1
        self.R = scale*np.random.randn(self.num_units+1,3)
        self.F_tanh = self.tanh_feats(self.num_units+1)
       
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
                if y_t[p] != y_t[p+1]:
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
        
    ##### transformation functions #####
    # random poly elements of deg < 10        
    def poly_feats(self,D):
        F = []
        for i in range(D+1):
            for j in range(D+1-i):
                f = (self.x[:,0]**i)*(self.x[:,1]**j)  
                F.append(f)
        F = np.asarray(F)
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
        val = 0
        c = 0
        for i in range(self.D+1):
            for j in range(self.D+1-i):
                val += w[c]*(pt[0]**i)*(pt[1]**j)     
                c+=1
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
    
    ###### optimizer ######
    def boosting(self,F,y,its):
        '''
        boosting for classification
        '''

        # settings 
        N = np.shape(F)[1]                      # length of weights
        w = np.zeros((N,1))              # initialization
        epsilon = 10**(-8)
        w_history = [copy.deepcopy(w)]     # record each weight for plotting

        # pre-computations for more effecient run
        y_diag = np.diagflat(y)
        M = np.dot(y_diag,F)
        F_2 = F**2
        c = np.dot(M,w)

        # outer loop - each is a sweep through every variable once
        for i in range(its):
            # inner loop
            cost_vals = []
            w_vals = []
            for t in range(N):
                w_temp = copy.deepcopy(w)
                w_t = copy.deepcopy(w[t])

                # create 'a' vector for this update
                m_t = M[:,t]
                m_t.shape = (len(m_t),1)
                temp_t = m_t*w_t
                c = c - temp_t
                a_t = np.exp(-c)

                # create first derivative via components
                exp_t = np.exp(temp_t)
                num = a_t*m_t            
                den = exp_t + a_t     
                dgdw = - sum([e/r for e,r in zip(num,den)])

                # create second derivative via components
                f_t = F_2[:,t]
                f_t.shape = (len(f_t),1)
                num = a_t*f_t*exp_t
                den = den**2
                dgdw2 = sum([e/r for e,r in zip(num,den)])

                # take newton step
                w_t = w_t - dgdw/(dgdw2 + epsilon)

                # temp history
                w_temp[t] = w_t
                val = self.softmax(w_temp)
                cost_vals.append(val)
                w_vals.append(w_t)

                # update computation                        
                temp_t = M[:,t]*w_t
                temp_t.shape = (len(temp_t),1)
                c = c + temp_t

            # determine biggest winner
            ind_win = np.argmin(cost_vals)
            w_win = w_vals[ind_win]
            w[ind_win] += copy.deepcopy(w_win)

            # update computation
            temp_t = M[:,ind_win]*w_win
            temp_t.shape = (len(temp_t),1)
            c = c + temp_t

            # record weights at each step for kicks
            w_history.append(copy.deepcopy(w))

            # update counter and tol measure
            i+=1
        return w_history
   
    # least squares
    def softmax(self,w):
        cost  = sum(np.log(1 + np.exp((-self.y)*(np.dot(self.F,w)))))
        return cost

    def brows_single_fits(self, num_units, basis,**kwargs):
        ### polynomials - run over num units and collect - here we collect full degrees, then sift out individual units from there ###
        num_elements = num_units

        # setup 
        self.num_units = max(num_units)
        self.dial_settings()
        opt = optimimzers.MyOptimizers()
        
        # viewing ranges
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
            
        # initialize figure
        fig = plt.figure(figsize = (9,4))
        artist = fig
        
        # create subplot with 3 panels, plot input function in center plot
        gs = gridspec.GridSpec(1, 3, width_ratios=[2,1,0.25]) 
        ax1 = plt.subplot(gs[0],aspect = 'equal'); ax1.axis('off');
        ax2 = plt.subplot(gs[1]); 
        ax = plt.subplot(gs[2]); ax.axis('off');
        
        
        # store weights
        weight_history = []
        cost_evals = []
        for k in range(len(num_units)):
            # loop over panels, produce plots
            self.D = num_units[k] + 1
 
            #### initialize poly transform ####
            self.F = self.poly_feats(self.D)

            ###### optiimize #####
            w = opt.newtons_method(g = self.softmax,win = np.zeros((np.shape(self.F)[1],1)),max_its = 5,output = 'best',verbose = False,beta = 10**(-7))
            
            # store
            weight_history.append(w)
            cost = self.softmax(w)
            cost_evals.append(cost)
            
        cost_evals = [v/float(np.size(self.y)) for v in cost_evals]
       
        ### animate ###
        print ('beginning animation rendering...')
        def animate(k):
            ax1.cla()
            ax2.cla()
           
            #### scatter data ####
            # plot points in 2d and 3d
            ind0 = np.argwhere(self.y == +1)
            ind0 = [e[0] for e in ind0]
            ax1.scatter(self.x[ind0,0],self.x[ind0,1],s = 55, color = self.colors[0], edgecolor = 'k')
                        
            ind1 = np.argwhere(self.y == -1)
            ind1 = [e[0] for e in ind1]
            ax1.scatter(self.x[ind1,0],self.x[ind1,1],s = 55, color = self.colors[1], edgecolor = 'k')
            
            # print rendering update
            if np.mod(k+1,5) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(len(num_units)))
            if k == len(num_units) - 1:
                print ('animation rendering complete!')
                time.sleep(1)
                clear_output()

            if k > 0:
                w = weight_history[k-1] 
                self.D = num_units[k-1] + 1
                self.F = self.poly_feats(self.D)
                title = 'degree ' + str(self.D) + ' poly (first ' + str(np.shape(self.F)[1]-1) + ' units)'
                ax1.set_title(title,fontsize = 14)
                self.predict = self.poly_predict
                
                
                ###### plot all #######
                # plot boundary for 2d plot
                r1 = np.linspace(xmin1,xmax1,300)
                r2 = np.linspace(xmin2,xmax2,300)
                s,t = np.meshgrid(r1,r2)
                s = np.reshape(s,(np.size(s),1))
                t = np.reshape(t,(np.size(t),1))
                h = np.concatenate((s,t),axis = 1)
                z = []
                for j in range(len(h)):
                    a = self.predict(h[j,:],w)
                    z.append(a)
                z = np.asarray(z)
                z = np.tanh(z)

                # reshape it
                s.shape = (np.size(r1),np.size(r2))
                t.shape = (np.size(r1),np.size(r2))     
                z.shape = (np.size(r1),np.size(r2))

                #### plot contour, color regions ####
                ax1.contour(s,t,z,colors='k', linewidths=2.5,levels = [0],zorder = 2)
                ax1.contourf(s,t,z,colors = [self.colors[1],self.colors[0]],alpha = 0.15,levels = range(-1,2))
                
                
                # plot cost path - scale to fit inside same aspect as classification plots
                # compute cost eval history
                for i in range(len(weight_history)):
                    item = copy.deepcopy(i)
                    w = weight_history[item]
                    self.D = len(weight_history) - 1

                num_iterations = len(weight_history)
                minxc = min(num_elements)-1
                maxxc = max(num_elements)+1
                gapxc = (maxxc - minxc)*0.1
                minxc -= gapxc
                maxxc += gapxc
                minc = min(copy.deepcopy(cost_evals))
                maxc = max(copy.deepcopy(cost_evals))
                gapc = (maxc - minc)*0.1
                minc -= gapc
                maxc += gapc



                # cost function value
                ax2.plot(num_elements,cost_evals,color = 'k',linewidth = 2.5,zorder = 1)
                ax2.scatter(num_elements[k-1],cost_evals[k-1],color = self.colors[0],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)

                ax2.set_xlabel('number of units',fontsize = 12)
                ax2.set_title('cost function plot',fontsize = 12)

                # cleanp panel
                ax2.set_xlim([minxc,maxxc])
                ax2.set_ylim([minc,maxc])
                  
            ### cleanup left plots, create max view ranges ###
            ax1.set_xlim([xmin1,xmax1])
            ax1.set_ylim([xmin2,xmax2])

            ax1.set_yticklabels([])
            ax1.set_xticklabels([])
            ax1.set_xticks([])
            ax1.set_yticks([])
            ax1.set_xlabel(r'$x_1$',fontsize = 15)
            ax1.set_ylabel(r'$x_2$',fontsize = 15,rotation = 0,labelpad = 20)  
                
                
        anim = animation.FuncAnimation(fig, animate,frames = len(num_units)+1, interval = len(num_units)+1, blit=True)
        
        return(anim)        

        
    ###### plot plotting functions ######
    def plot_data(self):
        # construct figure
        fig, axs = plt.subplots(1, 3, figsize=(8,3))

        # create subplot with 2 panels
        gs = gridspec.GridSpec(1, 3, width_ratios=[1,2,1]) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off') 
        ax2 = plt.subplot(gs[1]); 
        ax3 = plt.subplot(gs[2]); ax3.axis('off')
        
        if np.shape(self.x)[1] == 2:
            ax2 = plt.subplot(gs[1],projection='3d'); 
            
            ind0 = np.argwhere(self.y == +1)
            ax2.scatter(self.x[ind0,0],self.x[ind0,1],self.y[ind0],s = 55, color = self.colors[0], edgecolor = 'k')

            ind1 = np.argwhere(self.y == -1)
            ax2.scatter(self.x[ind1,0],self.x[ind1,1],self.y[ind1],s = 55, color = self.colors[1], edgecolor = 'k')

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
