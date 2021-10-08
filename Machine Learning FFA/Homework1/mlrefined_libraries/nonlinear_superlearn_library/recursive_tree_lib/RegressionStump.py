from autograd import numpy as np
import copy

# class for building regression stump
class Stump:
    ### load in data ###
    def __init__(self,x,y):
        # globals
        self.x = x
        self.y = y
        
        # find best stump given input data
        self.make_stump()
    
    ### an implementation of the least squares cost function for linear regression
    def least_squares(self,step,x,y):
        # compute cost
        cost = np.sum((step(x) - y)**2)
        return cost/float(np.size(y))
    
    ### create prototype steps ###
    def make_stump(self):
        # important constants: dimension of input N and total number of points P
        N = np.shape(self.x)[0]              
        P = np.size(self.y)

        # begin outer loop - loop over each dimension of the input - create split points and dimensions
        best_split = np.inf
        best_dim = np.inf
        best_val = np.inf
        best_left_leaf = []
        best_right_leaf = []
        for n in range(N):
            # make a copy of the n^th dimension of the input data (we will sort after this)
            x_n = copy.deepcopy(self.x[n,:])
            y_n = copy.deepcopy(self.y)

            # sort x_n and y_n according to ascending order in x_n
            sorted_inds = np.argsort(x_n,axis = 0)
            x_n = x_n[sorted_inds]
            y_n = y_n[:,sorted_inds]
            
            # loop over points and create stump in between each 
            # in dimension n
            for p in range(P - 1):
                if y_n[:,p] != y_n[:,p+1]:
                    # compute split point
                    split = (x_n[p] + x_n[p+1])/float(2)
                    
                    # compute leaf values   
                    left_ave = np.mean(y_n[:,:p+1]) 
                    right_ave = np.mean(y_n[:,p+1:])
                    left_leaf  = lambda x,left_ave=left_ave,dim=n: np.array([left_ave for v in x[dim,:]])
                    right_leaf = lambda x,right_ave=right_ave,dim=n: np.array([right_ave for v in x[dim,:]])
                                    
                    # create stump
                    step = lambda x,split=split,left_ave=left_ave,right_ave=right_ave,dim=n: np.array([(left_ave if v <= split else right_ave) for v in x[dim,:]])

                    # compute cost value on step
                    val = self.least_squares(step,self.x,self.y)

                    if val < best_val:
                        best_left_leaf = copy.deepcopy(left_leaf)
                        best_right_leaf = copy.deepcopy(right_leaf)
                        best_dim = copy.deepcopy(n)
                        best_split = copy.deepcopy(split)
                        best_val = copy.deepcopy(val)
                        
        # define globals
        self.left_leaf = best_left_leaf
        self.right_leaf = best_right_leaf
        self.dim = best_dim
        self.split = best_split
        
        # sort x_n and y_n according to ascending order in x_n
        sorted_inds = np.argsort(self.x[best_dim,:],axis = 0)
        self.x = self.x[:,sorted_inds]
        self.y = self.y[:,sorted_inds]
        
        # cull out points on each leaf
        left_inds = np.argwhere(self.x[best_dim,:] <= best_split).flatten()
        right_inds = np.argwhere(self.x[best_dim,:] > best_split).flatten()
            
        self.left_x = self.x[:,left_inds]
        self.right_x = self.x[:,right_inds]
        self.left_y = self.y[:,left_inds]
        self.right_y = self.y[:,right_inds]