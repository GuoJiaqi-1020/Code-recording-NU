from autograd import numpy as np
import copy
from . import TreeStructure
from . import RegressionStump

class RTree:
    def __init__(self,csvname,depth):
        # load data
        data = np.loadtxt(csvname,delimiter = ',')
        x = data[:-1,:]
        y = data[-1:,:] 
        self.depth = depth
        
        # build root regression stump
        self.tree = TreeStructure.Tree()
        stump = RegressionStump.Stump(x,y)
        self.build_tree(stump,self.tree,depth);
        
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
        if np.size(left_y) > 1 and len(np.unique(left_y)) > 1:
            left_stump = RegressionStump.Stump(left_x,left_y)
        if np.size(right_y) > 1 and len(np.unique(right_y)) > 1:
            right_stump = RegressionStump.Stump(right_x,right_y)
        return left_stump,right_stump

    def build_tree(self,stump,node,depth):
        if depth > 1:
            # define current node split
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf

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