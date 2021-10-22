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
from matplotlib.ticker import MaxNLocator


class Visualizer:
    '''
    Class for visualizing nonlinear regression fits to N = 1 dimensional input datasets
    '''

    # load target function
    def load_data(self,csvname):
        data = np.loadtxt(csvname,delimiter = ',').T
        print (data.shape)
        self.x = data[:,0]
        self.y = data[:,1]
        self.y.shape = (len(self.y),1)
        
    # initialize after animation call
    def dial_settings(self):        
        #### initialize split points for trees ####
        # sort data by values of input
        self.x_t = copy.deepcopy(self.x)
        self.y_t = copy.deepcopy(self.y)
        sorted_inds = np.argsort(self.x_t,axis = 0)
        self.x_t = self.x_t[sorted_inds]
        self.y_t = self.y_t[sorted_inds]

        # create temp copy of data, sort from smallest to largest
        splits = []
        levels = []
        residual = copy.deepcopy(self.y_t)

        ## create simple 'weak learner' between each consecutive pair of points ##
        for p in range(len(self.x_t) - 1):
            if self.y_t[p] != self.y_t[p+1]:
                # determine points on each side of split
                split = (self.x_t[p] + self.x_t[p+1])/float(2)
                splits.append(split)

                # gather points to left and right of split
                pts_left  = [t for t in self.x_t if t <= split]
                resid_left = residual[:len(pts_left)]
                resid_right = residual[len(pts_left):]

                # compute average on each side
                ave_left = np.mean(resid_left)
                ave_right = np.mean(resid_right)
                levels.append([ave_left,ave_right])
                
        # randomize splits for this experiment
        self.splits = splits
        self.levels = levels
                
        # generate features
        self.F_tree = self.tree_feats()
        
    # softmax
    def softmax(self,w):
        cost = 0
        for p in range(0,len(self.y)):
            x_p = self.x[p]
            y_p = self.y[p]
            cost +=np.log(1 + np.exp(-y_p*self.predict(x_p,w)))
        return cost
    
    ##### transformation functions #####
    # poly features
    def poly_feats(self,D):
        F = []
        for deg in range(D+1):
            F.append(self.x**deg)
        F = np.asarray(F)
        F.shape = (D+1,len(self.x))
        return F.T
    
    # tanh features
    def tanh_feats(self,D):
        F = [np.ones((len(self.x)))]
        for deg in range(D):
            F.append(np.tanh(self.R[deg,0] + self.R[deg,1]*self.x))
        F = np.asarray(F)
        F.shape = (D+1,len(self.x))
        return F.T
    
    # stump-tree feats
    def tree_feats(self):
        # feat matrix container
        F = []

        # loop over points and create feature vector based on stump for each
        for pt in self.x:
            f = [1]
            for i in range(len(self.splits)):
                # get current stump
                split = self.splits[i]
                level = self.levels[i]
                
                # check - which side of this split does the pt lie?
                if pt <= split:  # lies to the left - so evaluate at left level
                    f.append(level[0])
                else:
                    f.append(level[1])
            
            # save stump evaluations - this is our feature vector for pt
            F.append(f)
                    
        # make numpy array
        F = np.asarray(F)
        return F

    ##### prediction functions #####
    # standard polys
    def poly_predict(self,pt,w):
        # linear combo
        val = w[0] + sum([w[i]*pt**i for i in range(1,self.D+1)])
        return val
    
    # single hidden layer tanh network with fixed random weights
    def tanh_predict(self,pt,w):
        # linear combo
        val = w[0] + sum([w[i]*np.tanh(self.R[i-1,0] + self.R[i-1,1]*pt)  for i in range(1,self.D+1)])
        return val
    
    # tree prediction
    def tree_predict(self,pt,w): 
        # our return prediction
        val = 0
        val += w[0]
        
        # loop over current stumps and collect weighted evaluation
        for i in range(len(self.splits)):
            # get current stump
            split = self.splits[i]
            levels = self.levels[i]
                
            # check - which side of this split does the pt lie?
            if pt <= split:  # lies to the left - so evaluate at left level
                val += w[i+1]*levels[0]
            else:
                val += w[i+1]*levels[1]
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

    ###### fit and compare ######
    def brows_single_fit(self,**kwargs):
        # parse input args
        num_elements = [1,10,len(self.y)]
        if 'num_units' in kwargs:
            num_elements = kwargs['num_units']
            
        basis = kwargs['basis']
        self.colors = [[1,0,0.4], [ 0, 0.4, 1],[0, 1, 0.5],[1, 0.7, 0.5],[0.7, 0.6, 0.5],'mediumaquamarine']
        
        # construct figure
        fig = plt.figure(figsize = (9,3))
        artist = fig
        self.dial_settings()

        # create subplot with 3 panels, plot input function in center plot
        gs = gridspec.GridSpec(1, 2, width_ratios=[1,1]) 
        ax1 = plt.subplot(gs[0]); ax1.axis('off');
        ax2 = plt.subplot(gs[1]); ax2.axis('off');
        
        # set dials for tanh network and trees
        num_elements = [v+1 for v in num_elements]
        self.num_elements = max(num_elements)
        opt = optimimzers.MyOptimizers()

        # choose basis type
        self.F = []
        weight_history = []
        if basis == 'poly':
            self.F = self.poly_feats(self.num_elements)
            
            # collect poly and tanh weights over each desired level
            for element in num_elements:
                # fit weights to data
                w = np.linalg.lstsq(self.F[:,:element], self.y)[0]

                # store weights
                weight_history.append(w)
                
            self.predict = self.poly_predict

        if basis == 'tanh':
            # random weights for tanh network, tanh transform 
            scale = 1
            self.R = scale*np.random.randn(self.num_elements,2)
            self.F = self.tanh_feats(self.num_elements)
            
            # collect poly and tanh weights over each desired level
            for element in num_elements:
                # fit weights to data
                w = np.linalg.lstsq(self.F[:,:element], self.y)[0]

                # store weights
                weight_history.append(w)
            
            self.predict = self.tanh_predict

        if basis == 'tree':
            self.predict = self.tree_predict
            self.F = self.F_tree
            weight_history = self.boosting(self.F,self.y,its = self.num_elements)
            self.predict = self.tree_predict
            
            # generate three panels - one to show current basis element being fit
            gs = gridspec.GridSpec(1, 3, width_ratios=[1,1,1]) 
            ax = plt.subplot(gs[0]); ax1.axis('off');
            ax1 = plt.subplot(gs[1]); ax2.axis('off');
            ax2 = plt.subplot(gs[2]); ax2.axis('off');
            
        # compute cost eval history
        cost_evals = []
        for i in range(len(weight_history)):
            item = copy.deepcopy(i)
            w = weight_history[item]
            self.D = len(w) - 1
            cost = self.softmax(w)
            cost_evals.append(cost)
     
        # plot cost path - scale to fit inside same aspect as classification plots
        num_iterations = len(weight_history)
        minxc = min(num_elements)-1
        maxxc = max(num_elements)-1
        gapxc = (maxxc - minxc)*0.1
        minxc -= gapxc
        maxxc += gapxc
        minc = min(copy.deepcopy(cost_evals))
        maxc = max(copy.deepcopy(cost_evals))
        gapc = (maxc - minc)*0.5
        minc -= gapc
        maxc += gapc

        ### plot it
        # set viewing range for all 3 panels
        xmax = max(copy.deepcopy(self.x))
        xmin = min(copy.deepcopy(self.x))
        xgap = (xmax - xmin)*0.05
        xmax += xgap
        xmin -= xgap
        ymax = max(copy.deepcopy(self.y))[0]
        ymin = min(copy.deepcopy(self.y))[0]
        ygap = (ymax - ymin)*0.4
        ymax += ygap
        ymin -= ygap

        # animate
        print ('beginning animation rendering...')
        def animate(k):
            # clear the panel
            ax1.cla()
            ax2.cla()
            
            # print rendering update
            if np.mod(k+1,5) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(len(num_elements)))
            if k == len(num_elements) - 1:
                print ('animation rendering complete!')
                time.sleep(1)
                clear_output()
                
            # loop over panels, produce plots
            self.D = num_elements[k] 
            cs = 0

            # fit to data
            F = 0
            predict = 0
            w = 0
            if basis == 'poly': 
                w = weight_history[k]
                self.D = len(w) - 1
                ax1.set_title(str(self.D) + ' poly units',fontsize = 14)
                self.predict = self.poly_predict
                                       
            elif basis == 'tanh':
                w = weight_history[k]
                self.D = len(w) - 1
                ax1.set_title(str(self.D) + ' tanh units',fontsize = 14)
                self.predict = self.tanh_predict
                    
            elif basis == 'tree':
                item = min(len(self.y)-1, num_elements[k]-1,len(weight_history)-1) 
                w = weight_history[item]
                ax1.set_title(str(item) + ' tree units',fontsize = 14)
                self.predict = self.tree_predict

            ####### plot all and dress panel ######
            # produce learned predictor
            s = np.linspace(xmin,xmax,400)
            t = [np.sign(self.predict(np.asarray([v]),w)) for v in s]

            # plot approximation and data in panel
            ax1.scatter(self.x,self.y,c = 'k',edgecolor = 'w',s = 50,zorder = 1)
            ax1.plot(s,t,linewidth = 2.75,color = self.colors[2],zorder = 3)
            #cs += 1

            # cleanup panel
            ax1.set_xlim([xmin,xmax])
            ax1.set_ylim([ymin,ymax])
            ax1.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
            ax1.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
            ax1.set_xticks(np.arange(round(xmin), round(xmax)+1, 1.0))
            ax1.set_yticks(np.arange(round(ymin), round(ymax)+1, 1.0))
            
            # cost function value
            ax2.plot([v-1 for v in num_elements[:k+1]],cost_evals[:k+1],color = 'b',linewidth = 1.5,zorder = 1)
            ax2.scatter([v-1 for v in num_elements[:k+1]],cost_evals[:k+1],color = 'b',s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)

            ax2.set_xlabel('iteration',fontsize = 12)
            ax2.set_title('cost function plot',fontsize = 12)
            
            # cleanp panel
            ax2.set_xlim([minxc,maxxc])
            ax2.set_ylim([minc,maxc])
            ax2.xaxis.set_major_locator(MaxNLocator(integer=True))
            
            ### if basis == tree, show the most recently added element as well
            if basis == 'tree':
                ax.cla()
                
                # plot data
                ax.scatter(self.x,self.y,c = 'k',edgecolor = 'w',s = 50,zorder = 1)

                # plot tree
                item = min(len(self.y)-1, num_elements[k]-1,len(weight_history)-1)
                w = 0
                if k == 0:   # on the first slide just show first stump
                    w = np.sign(weight_history[item])
              
                else:        # show most recently added
                    w1 = weight_history[item]
                    w2 = weight_history[item-1]
                    w = w1 - w2
                    ind = np.argmax(np.abs(w))
                    w2 = np.zeros((len(w),1))
                    w2[ind] = 1
                    w = w2
                ax.set_title('best fit tree unit',fontsize = 14)
                self.predict = self.tree_predict
                s = np.linspace(xmin,xmax,400)
                t = [self.predict(np.asarray([v]),w) for v in s]
                ax.plot(s,t,linewidth = 2.75,color = self.colors[0],zorder = 3)

                # cleanup panel
                ax.set_xlim([xmin,xmax])
                ax.set_ylim([ymin,ymax])
                ax.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
                ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
                ax.set_xticks(np.arange(round(xmin), round(xmax)+1, 1.0))
                ax.set_yticks(np.arange(round(ymin), round(ymax)+1, 1.0))
                
                
        anim = animation.FuncAnimation(fig, animate,frames = len(num_elements), interval = len(num_elements), blit=True)
        
        return(anim)
    
    
    ########### cross-validation functionality ###########
    
    # function for splitting dataset into k folds
    def split_data(self,folds):
        # split data into k equal (as possible) sized sets
        L = np.size(self.y)
        order = np.random.permutation(L)
        c = np.ones((L,1))
        L = int(np.round((1/folds)*L))
        for s in np.arange(0,folds-2):
            c[order[s*L:(s+1)*L]] = s + 2
        c[order[(folds-1)*L:]] = folds
        return c
    
    ###### fit and compare ######
    def brows_single_cross_val(self,**kwargs):
        # parse input args
        num_elements = [1,10,len(self.y)]
        if 'num_elements' in kwargs:
            num_elements = kwargs['num_elements']
        basis = kwargs['basis']
        self.colors = [[1,0,0.4], [ 0, 0.4, 1],[0, 1, 0.5],[1, 0.7, 0.5],[0.7, 0.6, 0.5],'mediumaquamarine']
        folds = kwargs['folds']
        
        # make indices for split --> keep first fold for test, last k-1 for training
        c = self.split_data(folds)
        train_inds = np.argwhere(c > 1)
        train_inds = [v[0] for v in train_inds]
       
        test_inds = np.argwhere(c == 1)
        test_inds = [v[0] for v in test_inds]
        
        # split up points this way
        self.x_train = copy.deepcopy(self.x[train_inds])
        self.x_test = copy.deepcopy(self.x[test_inds])
        self.y_train = copy.deepcopy(self.y[train_inds])
        self.y_test = copy.deepcopy(self.y[test_inds])
        
        # set dials for tanh network and trees
        num_elements = [v+1 for v in num_elements]
        self.num_elements = max(num_elements)
        opt = optimimzers.MyOptimizers()

        # choose basis type
        self.F = []
        weight_history = []
        if basis == 'poly':
            self.F = self.poly_feats(self.num_elements)
            self.F_train = self.F[train_inds,:]
            self.F_test = self.F[test_inds,:]
            
            # collect poly and tanh weights over each desired level
            for element in num_elements:
                # fit weights to data
                w = np.linalg.lstsq(self.F_train[:,:element], self.y_train)[0]

                # store weights
                weight_history.append(w)
                
            self.predict = self.poly_predict

        if basis == 'tanh':
            # random weights for tanh network, tanh transform 
            scale = 1
            self.R = scale*np.random.randn(self.num_elements,2)
            self.F = self.tanh_feats(self.num_elements)
            self.F_train = self.F[train_inds,:]
            self.F_test = self.F[test_inds,:]
            
            # collect poly and tanh weights over each desired level
            for element in num_elements:
                # fit weights to data
                w = np.linalg.lstsq(self.F_train[:,:element], self.y_train)[0]

                # store weights
                weight_history.append(w)
            
            self.predict = self.tanh_predict

        if basis == 'tree':
            self.dial_settings()
            self.F = self.F_tree
            self.F_train = self.F[train_inds,:]
            self.F_test = self.F[test_inds,:]
            weight_history = self.boosting(self.F_train,self.y_train,its = 3000)

            # compute number of non-zeros per weight in history
            nonzs = [len(np.argwhere(w != 0)) for w in weight_history]

            # find unique additions
            huh = np.asarray([np.sign(abs(nonzs[p] - nonzs[p+1])) for p in range(len(nonzs)-1)])
            inds = np.argwhere(huh == 1)
            inds = [v[0] for v in inds]

            # sift through, make sure to pick the best fit
            new_inds = []
            for j in range(len(inds)-1):
                val = inds[j+1] - inds[j]
                if val > 2:
                    new_inds.append(inds[j+1] - 1)
                else:
                    new_inds.append(inds[j])
            new_inds.append(inds[-1])
            weight_history = [weight_history[ind] for ind  in new_inds]
            weight_history = [weight_history[ind - 2] for ind in num_elements]
            self.predict = self.tree_predict

        
        ### compute training and testing cost eval history ###
        train_errors = []
        test_errors = []
        for i in range(len(weight_history)):
            item = copy.deepcopy(i)
            if basis == 'tree':
                item = min(len(self.y)-1, num_elements[i]-1,len(weight_history)-1) 
            w = weight_history[item]
            self.D = len(w) - 1

            # compute training error 
            self.x_orig = copy.deepcopy(self.x)
            self.x = self.x_train
            self.y_orig = copy.deepcopy(self.y)
            self.y = self.y_train           
            train_error = (self.least_squares(w)/float(len(self.y_train)))**(0.5)
            train_errors.append(train_error)
            
            # compute testing error
            self.x = copy.deepcopy(self.x_orig)
            self.x_orig = copy.deepcopy(self.x)
            self.x = self.x_test
            self.y = copy.deepcopy(self.y_orig)
            self.y_orig = copy.deepcopy(self.y)
            self.y = self.y_test          
            test_error = (self.least_squares(w)/float(len(self.y_test)))**(0.5)
            
            self.y = copy.deepcopy(self.y_orig)
            self.x = copy.deepcopy(self.x_orig)

            # store training and testing errors
            test_error = self.least_squares(w)
            test_errors.append(test_error)
     
        # plot cost path - scale to fit inside same aspect as classification plots
        num_iterations = len(weight_history)
        minxc = min(num_elements)-1
        maxxc = max(num_elements)-1
        gapxc = (maxxc - minxc)*0.1
        minxc -= gapxc
        maxxc += gapxc
        minc = min(min(copy.deepcopy(train_errors)),min(copy.deepcopy(test_errors)))
        maxc = max(max(copy.deepcopy(train_errors[:4])),max(copy.deepcopy(test_errors[:4])))
        gapc = (maxc - minc)*0.5
        minc -= gapc
        maxc += gapc

        ### plot it
        # construct figure
        fig = plt.figure(figsize = (11,3))
        artist = fig

        # create subplot with 3 panels, plot input function in center plot
        gs = gridspec.GridSpec(1, 4, width_ratios=[1,1,1,1]) 
        ax = plt.subplot(gs[0]); ax.axis('off');
        ax1 = plt.subplot(gs[1]); ax1.axis('off');
        ax2 = plt.subplot(gs[2]); ax2.axis('off');
        ax3 = plt.subplot(gs[3]); ax2.axis('off');

        # set viewing range for all 3 panels
        xmax = max(copy.deepcopy(self.x))
        xmin = min(copy.deepcopy(self.x))
        xgap = (xmax - xmin)*0.05
        xmax += xgap
        xmin -= xgap
        ymax = max(copy.deepcopy(self.y))[0]
        ymin = min(copy.deepcopy(self.y))[0]
        ygap = (ymax - ymin)*0.4
        ymax += ygap
        ymin -= ygap

        # animate
        print ('beginning animation rendering...')
        def animate(k):
            # clear the panel
            ax.cla()
            ax1.cla()
            ax2.cla()
            ax3.cla()
            
            # print rendering update
            if np.mod(k+1,5) == 0:
                print ('rendering animation frame ' + str(k+1) + ' of ' + str(len(num_elements)))
            if k == len(num_elements):
                print ('animation rendering complete!')
                time.sleep(1)
                clear_output()
                
                
            #### plot data and clean up panels ####
            # scatter data
            ax.scatter(self.x,self.y,color = 'k',edgecolor = 'w',s = 50,zorder = 1)
            ax1.scatter(self.x_train,self.y_train,color = [0,0.7,1],edgecolor = 'k',s = 60,zorder = 1)
            ax2.scatter(self.x_test,self.y_test,color = [1,0.8,0.5],edgecolor = 'k',s = 60,zorder = 1)

            # cleanup panels
            ax.set_xlim([xmin,xmax])
            ax.set_ylim([ymin,ymax])
            ax.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
            ax.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
            ax.set_xticks(np.arange(round(xmin), round(xmax)+1, 1.0))
            ax.set_yticks(np.arange(round(ymin), round(ymax)+1, 1.0))
            ax.set_title('orig data',fontsize = 12)

            ax1.set_xlim([xmin,xmax])
            ax1.set_ylim([ymin,ymax])
            ax1.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
            ax1.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
            ax1.set_xticks(np.arange(round(xmin), round(xmax)+1, 1.0))
            ax1.set_yticks(np.arange(round(ymin), round(ymax)+1, 1.0))
            ax1.set_title('train data',fontsize = 12)

            ax2.set_xlim([xmin,xmax])
            ax2.set_ylim([ymin,ymax])
            ax2.set_xlabel(r'$x$', fontsize = 14,labelpad = 10)
            ax2.set_ylabel(r'$y$', rotation = 0,fontsize = 14,labelpad = 10)
            ax2.set_xticks(np.arange(round(xmin), round(xmax)+1, 1.0))
            ax2.set_yticks(np.arange(round(ymin), round(ymax)+1, 1.0))
            ax2.set_title('test data',fontsize = 12)
                          
             # cleanup
            ax3.set_xlabel('number of units',fontsize = 12)
            ax3.set_title('errors',fontsize = 12)
           
            # cleanp panel
            ax3.set_xlim([minxc,maxxc])
            ax3.set_ylim([minc,maxc])
            ax3.xaxis.set_major_locator(MaxNLocator(integer=True))
                     
            if k > 0:
                # loop over panels, produce plots
                self.D = num_elements[k-1] 
                cs = 0

                # fit to data
                F = 0
                predict = 0
                w = 0
                if basis == 'poly': 
                    w = weight_history[k-1]
                    self.D = len(w) - 1
                    #ax1.set_title(str(self.D) + ' poly units',fontsize = 14)
                    self.predict = self.poly_predict

                elif basis == 'tanh':
                    w = weight_history[k-1]
                    self.D = len(w) - 1
                    #ax1.set_title(str(self.D) + ' tanh units',fontsize = 14)
                    self.predict = self.tanh_predict

                elif basis == 'tree':
                    item = min(len(self.y)-1, num_elements[k-1]-1,len(weight_history)-1) 
                    w = weight_history[item]
                    #ax1.set_title(str(item) + ' tree units',fontsize = 14)
                    self.predict = self.tree_predict


                # produce learned predictor
                s = np.linspace(xmin,xmax,400)
                t = [self.predict(np.asarray([v]),w) for v in s]

                # plot approximation and data in panel
                ax.plot(s,t,linewidth = 2.75,color = self.colors[cs],zorder = 3)
                ax1.plot(s,t,linewidth = 2.75,color = self.colors[cs],zorder = 3)
                ax2.plot(s,t,linewidth = 2.75,color = self.colors[cs],zorder = 3)
                cs += 1

                ### plot training and testing errors  
                ax3.plot([v-1 for v in num_elements[:k]],train_errors[:k],color = [0,0.7,1],linewidth = 1.5,zorder = 1,label = 'train error')
                ax3.scatter([v-1 for v in num_elements[:k]],train_errors[:k],color = [0,0.7,1],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)

                ax3.plot([v-1 for v in num_elements[:k]],test_errors[:k],color = [1,0.8,0.5],linewidth = 1.5,zorder = 1,label = 'test error')
                ax3.scatter([v-1 for v in num_elements[:k]],test_errors[:k],color= [1,0.8,0.5],s = 70,edgecolor = 'w',linewidth = 1.5,zorder = 3)


                legend = ax3.legend(loc='upper right')

            
        anim = animation.FuncAnimation(fig, animate,frames = len(num_elements)+1, interval = len(num_elements)+1, blit=True)
        
        return(anim)

