from matplotlib import pyplot as plt
from mlrefined_libraries.nonlinear_superlearn_library.recursive_tree_lib import ClassificationStump
import copy
import autograd.numpy as np

class Tree:
    def __init__(self):
        self.split = None
        self.node = None
        self.left = None
        self.right = None
        self.left_leaf = None
        self.right_leaf = None
        self.number_mis_class_left = 0
        self.number_mis_class_right = 0


class RTree:
    def __init__(self, csvname, depth):
        # load data
        data = np.loadtxt(csvname, delimiter=',')
        x = data[:-1, :]
        y = data[-1:, :]
        self.depth = depth

        # build root regression stump
        self.tree = Tree()
        stump = ClassificationStump.Stump(x, y)
        self.build_tree(stump, self.tree, depth)

    # function for building subtree based on a single stump
    def build_subtree(self, stump):
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

        if np.size(np.unique(left_y)) > 1:
            left_stump = ClassificationStump.Stump(left_x, left_y)
        if np.size(np.unique(right_y)) > 1:
            right_stump = ClassificationStump.Stump(right_x, right_y)
        return left_stump, right_stump

    def build_tree(self, stump, node, depth):
        if depth > 1:
            # define current node split
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf
            node.step = stump.step

            # define new stumps on each leaf of old stump
            left_stump, right_stump = self.build_subtree(stump)

            # create new nodes for subtree
            node.left = Tree()
            node.right = Tree()
            depth -= 1
            return self.build_tree(left_stump, node.left, depth), self.build_tree(right_stump, node.right, depth)
        else:
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf
            node.step = stump.step

    # tree evaluator
    def evaluate_tree(self, val, depth):
        if depth > self.depth:
            return 'desired depth greater than depth of tree'

        # search tree
        tree = copy.deepcopy(self.tree)
        d = 0
        while d < depth:
            split = tree.split
            dim = tree.dim
            if val[dim, :] <= split:
                tree = tree.left
            else:
                tree = tree.right
            d += 1

        # get final leaf value
        split = tree.split
        dim = tree.dim
        if val[dim, :] <= split:
            tree = tree.left_leaf
        else:
            tree = tree.right_leaf

        # return evaluation     
        return tree(val)
