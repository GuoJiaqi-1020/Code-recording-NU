from matplotlib import pyplot as plt
from mlrefined_libraries.nonlinear_superlearn_library.recursive_tree_lib.ClassificationTree import ClassificationStump
import copy
import autograd.numpy as np

depth_count = 1


class Decision_Tree(object):
    def __init__(self, file_path, depth):
        data = np.loadtxt(file_path, delimiter=',')
        self.misclassification = []
        x = data[:-1, :]
        y = data[-1:, :]
        self.depth = depth
        self.tree = Tree()
        stump = ClassificationStump.Stump(x, y)
        self.build_tree(stump, self.tree, depth)

    def build_subtree(self, stump):
        best_split = stump.split
        best_dim = stump.dim
        left_x = stump.left_x
        right_x = stump.right_x
        left_y = stump.left_y
        right_y = stump.right_y
        left_stump = stump
        right_stump = stump
        if np.size(np.unique(left_y)) > 1:
            left_stump = ClassificationStump.Stump(left_x, left_y)
        else:
            right_stump.right_y = right_stump.left_y
            left_stump.number_mis_class_left = 0
            left_stump.number_mis_class_right = 0
        if np.size(np.unique(right_y)) > 1:
            right_stump = ClassificationStump.Stump(right_x, right_y)
        else:
            right_stump.left_y = right_stump.right_y
            right_stump.number_mis_class_left = 0
            right_stump.number_mis_class_right = 0
        return left_stump, right_stump

    def build_tree(self, stump, node, depth):
        if depth > 1:
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf
            node.step = stump.step
            node.number_mis_class_left = stump.number_mis_class_left
            node.number_mis_class_right = stump.number_mis_class_right
            left_stump, right_stump = self.build_subtree(stump)
            depth -= 1
            if left_stump.number_mis_class_right + left_stump.number_mis_class_left == 0 \
                    and right_stump.number_mis_class_right + right_stump.number_mis_class_left == 0:
                depth = 1
            node.left = Tree()
            node.right = Tree()
            return self.build_tree(right_stump, node.right, depth), self.build_tree(left_stump, node.left, depth)
        else:
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf
            node.step = stump.step
            node.number_mis_class_left = stump.number_mis_class_left
            node.number_mis_class_right = stump.number_mis_class_right
            # node.all_miss = stump.all_miss
            self.misclassification.append(node.number_mis_class_left)
            self.misclassification.append(node.number_mis_class_right)

    # tree evaluator
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
        # self.all_miss = 0


def plot(y, depth):
    x = range(1, depth + 1)
    plt.plot(x, y, marker='o')
    plt.xticks(x, rotation=0)
    plt.xlabel("Depth of Decision Tree")
    plt.ylabel("Num of Mis-classification")
    for a, b in zip(x, y):
        plt.text(a, b, '%.0f' % b, fontsize=11, ha='left', va='bottom')
    plt.title("Mis-classification VS Depth")
    plt.show()


if __name__ == "__main__":
    depth = 7
    mis_history = []
    file_path = '../mlrefined_datasets/nonlinear_superlearn_datasets/new_circle_data.csv'
    for d in range(1, depth + 1):
        decision_tree = Decision_Tree(file_path, d)
        mis_history.append(sum(decision_tree.misclassification))
    plot(mis_history, depth)
