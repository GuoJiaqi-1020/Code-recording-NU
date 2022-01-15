from matplotlib import pyplot as plt
from mlrefined_libraries.nonlinear_superlearn_library.recursive_tree_lib.ClassificationTree import ClassificationStump
import autograd.numpy as np
import copy


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


class Random_Forest_Algorithm:
    def __init__(self, csvname, depth, train_portion):
        data = np.loadtxt(csvname, delimiter=',')
        self.x = data[:-1, :]
        self.y = data[-1:, :]
        self.depth = depth
        self.colors = ['salmon', 'cornflowerblue', 'lime', 'bisque', 'mediumaquamarine', 'b', 'm', 'g']
        self.plot_colors = ['lime', 'violet', 'orange', 'lightcoral', 'chartreuse', 'aqua', 'deeppink']

        self.make_train_val_split(train_portion)

        # build root regression stump
        self.tree = Tree()
        stump = ClassificationStump.Stump(self.x_train, self.y_train)

        # build remainder of tree
        self.build_tree(stump, self.tree, depth)

        # compute train / valid errors
        self.compute_train_val_accuracies()
        self.best_depth = np.argmax(self.valid_accuracies)

    def make_train_val_split(self, train_portion):
        self.train_portion = train_portion
        r = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion * len(r)))
        self.train_inds = r[:train_num]
        self.valid_inds = r[train_num:]
        self.x_train = self.x[:, self.train_inds]
        self.x_valid = self.x[:, self.valid_inds]
        self.y_train = self.y[:, self.train_inds]
        self.y_valid = self.y[:, self.valid_inds]

    def build_subtree(self, stump):
        # get params from input stump
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
        if np.size(np.unique(right_y)) > 1:
            right_stump = ClassificationStump.Stump(right_x, right_y)
        return left_stump, right_stump

    def build_tree(self, stump, node, depth):
        if depth > 1:
            node.split = stump.split
            node.dim = stump.dim
            node.left_leaf = stump.left_leaf
            node.right_leaf = stump.right_leaf
            node.step = stump.step
            left_stump, right_stump = self.build_subtree(stump)

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

            self.train_accuracies.append(train_miss)
            self.valid_accuracies.append(valid_miss)

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

    def draw_fused_model(self, runs):
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
        ind0 = np.argwhere(self.y == +1)
        ind0 = [v[1] for v in ind0]
        plt.scatter(self.x[0, ind0], self.x[1, ind0], s=60, color=self.colors[0], edgecolor='k', linewidth=1, zorder=3)
        ind1 = np.argwhere(self.y == -1)
        ind1 = [v[1] for v in ind1]
        plt.scatter(self.x[0, ind1], self.x[1, ind1], s=60, color=self.colors[1], edgecolor='k', linewidth=1, zorder=3)
        plt.xlim([xmin1, xmax1])
        plt.ylim([xmin2, xmax2])
        plt.title("Final Model of " + str(num_trees) + " Bagged Models")
        plt.xlabel(r'$x_1$', fontsize=14)
        plt.ylabel(r'$x_2$', rotation=0, fontsize=14, labelpad=10)
        s1 = np.linspace(xmin1, xmax1, 50)
        s2 = np.linspace(xmin2, xmax2, 50)
        a, b = np.meshgrid(s1, s2)
        a = np.reshape(a, (np.size(a), 1))
        b = np.reshape(b, (np.size(b), 1))
        h = np.concatenate((a, b), axis=1)
        a.shape = (np.size(s1), np.size(s2))
        b.shape = (np.size(s1), np.size(s2))
        t_ave = []
        for k in range(len(runs)):
            tree = runs[k]
            depth = tree.best_depth
            t = []
            for val in h:
                val = val[:, np.newaxis]
                out = tree.evaluate_tree(val, depth)
                t.append(out)
            t = np.array(t)
            t.shape = (np.size(s1), np.size(s2))
            col = np.random.rand(1, 3)
            plt.contour(s1, s2, t, linewidths=2.5, levels=[0], colors=self.plot_colors[k], zorder=2, alpha=0.4)
            t_ave.append(t)
        t_ave = np.array(t_ave)
        t_ave1 = np.median(t_ave, axis=0)
        plt.contour(s1, s2, t_ave1, linewidths=3.5, levels=[0], colors='k', zorder=4, alpha=1)
        plt.show()


def plot(y, label):
    x = range(1, len(y[1]) + 1)
    colors = ['dimgray', 'coral', 'aquamarine', 'crimson', 'blueviolet', 'chartreuse']
    plt.title(label)
    for i in range(len(y)):
        plt.plot(x, y[i], marker='o', color=colors[i])
    plt.xticks(x, rotation=0)
    plt.xlabel("Depth of Decision Tree")
    plt.ylabel("Accuracy")
    plt.show()


if __name__ == "__main__":
    file_path = '../mlrefined_datasets/nonlinear_superlearn_datasets/new_circle_data.csv'
    trees = []
    train_acc = []
    valid_acc = []
    num_trees = 5
    depth = 7
    train_portion = 0.66
    for i in range(num_trees):
        print("training fold: " + str(i))
        tree = Random_Forest_Algorithm(file_path, depth, train_portion=train_portion)
        trees.append(tree)
        train_acc.append(tree.train_accuracies)
        valid_acc.append(tree.valid_accuracies)
    # Compare the acc of training_set and validation_set
    plot(train_acc, label='Training set accuracy')
    plot(valid_acc, label='Validation set accuracy')
    # Draw 5+1 models all in one
    tree = Random_Forest_Algorithm(file_path, depth, train_portion=1)
    tree.draw_fused_model(runs=trees)
