from mlrefined_libraries.nonlinear_superlearn_library.recursive_tree_lib_crossval.classification_ensembler import \
    Visualizer
from mlrefined_libraries.nonlinear_superlearn_library.recursive_tree_lib_crossval.ClassificationTree import RTree
from mlrefined_libraries.nonlinear_superlearn_library.recursive_tree_lib.ClassificationTree import ClassificationStump
import autograd.numpy as np
import copy

from mlrefined_libraries.nonlinear_superlearn_library.kfolds_reg_lib.superlearn_setup import Setup




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
        self.all_miss = 0


class RTree:
    def __init__(self, csvname, depth, **kwargs):
        # load data
        data = np.loadtxt(csvname, delimiter=',')
        self.x = data[:-1, :]
        self.y = data[-1:, :]
        self.depth = depth

        # split data into training and validation sets
        train_portion = 1
        if 'train_portion' in kwargs:
            train_portion = kwargs['train_portion']
        self.make_train_val_split(train_portion)

        # build root regression stump
        self.tree = Tree()
        stump = ClassificationStump.Stump(self.x_train, self.y_train)

        # build remainder of tree
        self.build_tree(stump, self.tree, depth)

        # compute train / valid errors
        self.compute_train_val_accuracies()
        self.best_depth = np.argmax(self.valid_accuracies)

        # split data into training and validation sets

    def make_train_val_split(self, train_portion):
        # translate desired training portion into exact indecies
        self.train_portion = train_portion
        r = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion * len(r)))
        self.train_inds = r[:train_num]
        self.valid_inds = r[train_num:]

        # define training and testing sets
        self.x_train = self.x[:, self.train_inds]
        self.x_valid = self.x[:, self.valid_inds]

        self.y_train = self.y[:, self.train_inds]
        self.y_valid = self.y[:, self.valid_inds]

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
            return (self.build_tree(left_stump, node.left, depth), self.build_tree(right_stump, node.right, depth))
        else:
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf
            node.step = stump.step

    #### evaluation and metrics #####
    # compute cost over train and valid sets
    def compute_train_val_accuracies(self):
        self.train_accuracies = []
        self.valid_accuracies = []
        for j in range(self.depth):
            # compute training error
            train_evals = np.array([self.predict(v[:, np.newaxis], depth=j) for v in self.x_train.T]).T
            valid_evals = np.array([self.predict(v[:, np.newaxis], depth=j) for v in self.x_valid.T]).T

            # compute cost
            train_miss = 0
            if self.y_train.size > 0:
                train_miss = 1 - len(np.argwhere(train_evals != self.y_train)) / self.y_train.size
            valid_miss = 0
            if self.y_valid.size > 0:
                valid_miss = 1 - len(np.argwhere(valid_evals != self.y_valid)) / self.y_valid.size

            # store
            self.train_accuracies.append(train_miss)
            self.valid_accuracies.append(valid_miss)

            # tree evaluator
    def predict(self, val, **kwargs):
        depth = self.depth
        if 'depth' in kwargs:
            depth = kwargs['depth']

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

    def evaluate_tree(self, val, depth):
        if depth > self.depth:
            return ('desired depth greater than depth of tree')

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
        return tree(val)


if __name__ == "__main__":
    file_path = '../mlrefined_datasets/nonlinear_superlearn_datasets/new_circle_data.csv'
    trees = []
    num_trees = 5
    depth = 7
    train_portion = 0.66
    for i in range(num_trees):
        tree = RTree(file_path, depth, train_portion=train_portion)
        trees.append(tree)

    animator = Visualizer(file_path)
    animator.show_runs(trees)
