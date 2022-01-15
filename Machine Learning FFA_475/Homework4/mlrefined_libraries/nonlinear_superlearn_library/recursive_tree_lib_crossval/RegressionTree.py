from autograd import numpy as np
import copy
from . import TreeStructure
from . import RegressionStump

class RTree:
    def __init__(self,csvname,depth,**kwargs):
        # load data
        data = np.loadtxt(csvname,delimiter = ',')
        self.x = data[:-1,:]
        self.y = data[-1:,:] 
        self.depth = depth
        
        # split data into training and validation sets
        train_portion = 1
        if 'train_portion' in kwargs:
            train_portion = kwargs['train_portion']
        self.make_train_val_split(train_portion)
        
        # build root regression stump
        self.tree = TreeStructure.Tree()
        stump = RegressionStump.Stump(self.x_train,self.y_train)
        
        # build remainder of tree
        self.build_tree(stump,self.tree,depth);
        
        # compute train / valid errors
        self.compute_train_val_costs()
        self.best_depth = np.argmin(self.valid_errors)
            
    # compute cost over train and valid sets
    def compute_train_val_costs(self):
        self.train_errors = []
        self.valid_errors = []
        for j in range(self.depth):
            # compute training error
            train_evals = np.array([self.evaluate_tree(v[np.newaxis,:],j) for v in self.x_train.T]).T
            valid_evals = np.array([self.evaluate_tree(v[np.newaxis,:],j) for v in self.x_valid.T]).T

            # compute cost
            train_cost = np.sum((train_evals - self.y_train)**2)/self.y_train.size
            valid_cost = np.sum((valid_evals - self.y_valid)**2)/self.y_valid.size

            # store
            self.train_errors.append(train_cost)
            self.valid_errors.append(valid_cost)
        
    # split data into training and validation sets 
    def make_train_val_split(self,train_portion):
        # translate desired training portion into exact indecies
        self.train_portion = train_portion
        r = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion*len(r)))
        self.train_inds = r[:train_num]
        self.valid_inds = r[train_num:]
        
        # define training and testing sets
        self.x_train = self.x[:,self.train_inds]
        self.x_valid = self.x[:,self.valid_inds]
        
        self.y_train = self.y[:,self.train_inds]
        self.y_valid = self.y[:,self.valid_inds]     

    # function for building subtree based on a single stump
    def build_subtree(self,stump):    
        # get params from input stump
        best_split = stump.split
        best_dim = stump.dim
        left_x = stump.left_x
        right_x = stump.right_x
        left_y = stump.left_y
        right_y = stump.right_y

        # make left stump
        left_stump = stump
        right_stump = stump
        if np.size(left_y) > 1:
            left_stump = RegressionStump.Stump(left_x,left_y)
        if np.size(right_y) > 1:
            right_stump = RegressionStump.Stump(right_x,right_y)
        return left_stump,right_stump

    def build_tree(self,stump,node,depth):
        if depth > 1:
            # define current node split
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf
            node.step = stump.step

            # define new stumps on each leaf of old stump
            left_stump,right_stump = self.build_subtree(stump)

            # create new nodes for subtree
            node.left = TreeStructure.Tree()
            node.right = TreeStructure.Tree()
            depth -= 1
            return (self.build_tree(left_stump,node.left,depth),self.build_tree(right_stump,node.right,depth))
        else:
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf
            node.step = stump.step
    
    # tree evaluator
    def evaluate_tree(self,val,depth):
        if depth > self.depth:
            return ('desired depth greater than depth of tree')
        
        # search tree
        tree = copy.deepcopy(self.tree)
        d = 0
        while d < depth:
            split = tree.split
            dim = tree.dim
            if val[dim,:] <= split:
                tree = tree.left
            else:
                tree = tree.right
            d+=1

        # get final leaf value
        split = tree.split
        dim = tree.dim
        if val[dim,:] <= split:
            tree = tree.left_leaf
        else:
            tree = tree.right_leaf
                
        # return evaluation     
        return tree(val)