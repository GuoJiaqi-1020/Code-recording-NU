from autograd import numpy as np
import copy

from matplotlib import pyplot as plt

left_his = []
right_his = []


# class for building regression stump
class Stump:
    ### load in data ###
    def __init__(self, x, y):
        # globals
        self.x = x
        self.y = y
        # find best stump given input data
        self.make_stump()

    ### an implementation of the least squares cost function for linear regression
    def counter(self, step, x, y):
        # compute predictions
        y_hat = step(x)[np.newaxis, :]

        # compute total counts
        vals, counts = np.unique(y, return_counts=True)

        # compute misclass on each class, compute balanced accuracy
        balanced = 0
        for i in range(len(vals)):
            v = vals[i]
            c = counts[i]
            ind = np.argwhere(y == v)
            miss_val = 1
            if ind.size > 0:
                ind = [a[1] for a in ind]
                miss = np.argwhere(y_hat[:, ind] != y[:, ind])
                if miss.size > 0:
                    miss = len([a[1] for a in miss])
                    miss_val = (1 - miss / c)
            balanced += miss_val
        balanced = balanced / len(vals)
        return balanced

    ### create prototype steps ###
    def make_stump(self):
        # important constants: dimension of input N and total number of points P
        N = np.shape(self.x)[0]
        P = np.size(self.y)

        # begin outer loop - loop over each dimension of the input - create split points and dimensions
        acc_matrix_right = [0] * N
        acc_matrix_left = [0] * N
        best_split = np.inf
        best_dim = np.inf
        best_val = -np.inf
        best_left_leaf = []
        best_right_leaf = []
        best_left_ave = []
        best_right_ave = []
        best_step = []
        c_vals, c_counts = np.unique(self.y, return_counts=True)
        self.c_counts = c_counts
        for n in range(N):
            # make a copy of the n^th dimension of the input data (we will sort after this)
            x_n = copy.deepcopy(self.x[n, :])
            y_n = copy.deepcopy(self.y)

            # sort x_n and y_n according to ascending order in x_n
            sorted_inds = np.argsort(x_n, axis=0)
            # 将元素从小到大排列，提取对应得index
            x_n = x_n[sorted_inds]
            y_n = y_n[:, sorted_inds]

            # loop over points and create stump in between each 
            # in dimension n
            for p in range(P - 1):
                if y_n[:, p] != y_n[:, p + 1]:
                    # compute split point
                    split = (x_n[p] + x_n[p + 1]) / float(2)

                    ## determine most common label relative to proportion of each class present ##
                    # compute various counts and decide on levels
                    y_n_left = y_n[:, :p + 1]
                    y_n_right = y_n[:, p + 1:]
                    c_left_vals, c_left_counts = np.unique(y_n_left, return_counts=True)
                    c_right_vals, c_right_counts = np.unique(y_n_right, return_counts=True)

                    prop_left = []
                    prop_right = []
                    for i in range(np.size(c_vals)):
                        val = c_vals[i]
                        count = c_counts[i]

                        # check left side
                        # 找到
                        val_ind = np.argwhere(c_left_vals == val)
                        val_count = 0
                        if np.size(val_ind) > 0:
                            val_count = c_left_counts[val_ind][0][0]
                        prop_left.append(val_count / count)

                        # check right side
                        val_ind = np.argwhere(c_right_vals == val)
                        val_count = 0
                        if np.size(val_ind) > 0:
                            val_count = c_right_counts[val_ind][0][0]
                        prop_right.append(val_count / count)

                    # array it
                    prop_left = np.array(prop_left)
                    best_left = np.argmax(prop_left)
                    left_ave = c_vals[best_left]
                    best_acc_left = prop_left[best_left]
                    # left = y_n_left.size / y_n.size

                    prop_right = np.array(prop_right)
                    best_right = np.argmax(prop_right)
                    right_ave = c_vals[best_right]
                    best_acc_right = prop_right[best_right]
                    # right = y_n_right.size / y_n.size
                    val = (best_acc_left + best_acc_right) / 2

                    # define leaves
                    left_leaf = lambda x, left_ave=left_ave, dim=n: np.array([left_ave for v in x[dim, :]])
                    right_leaf = lambda x, right_ave=right_ave, dim=n: np.array([right_ave for v in x[dim, :]])

                    # create stump
                    step = lambda x, split=split, left_ave=left_ave, right_ave=right_ave, dim=n: np.array(
                        [(left_ave if v <= split else right_ave) for v in x[dim, :]])

                    # compute cost value on step
                    # val = self.counter(step,self.x,self.y)

                    if val > best_val:
                        acc_matrix_right = prop_right
                        acc_matrix_left = prop_left
                        best_left_leaf = copy.deepcopy(left_leaf)
                        best_right_leaf = copy.deepcopy(right_leaf)

                        best_dim = copy.deepcopy(n)
                        best_split = copy.deepcopy(split)
                        best_val = copy.deepcopy(val)
                        best_left_ave = copy.deepcopy(left_ave)
                        best_right_ave = copy.deepcopy(right_ave)
                        best_step = copy.deepcopy(step)

        # define globals
        self.step = best_step
        self.left_leaf = best_left_leaf
        self.right_leaf = best_right_leaf
        self.dim = best_dim
        self.split = best_split

        # sort x_n and y_n according to ascending order in x_n
        sorted_inds = np.argsort(self.x[best_dim, :], axis=0)
        self.x = self.x[:, sorted_inds]
        self.y = self.y[:, sorted_inds]

        # cull out points on each leaf
        left_inds = np.argwhere(self.x[best_dim, :] <= best_split).flatten()
        right_inds = np.argwhere(self.x[best_dim, :] > best_split).flatten()

        self.left_x = self.x[:, left_inds]
        self.right_x = self.x[:, right_inds]
        self.left_y = self.y[:, left_inds]
        self.right_y = self.y[:, right_inds]
        self.number_mis_class_left = self.caculate_mis_class(acc_matrix_right, acc_matrix_left)[0]
        self.number_mis_class_right = self.caculate_mis_class(acc_matrix_right, acc_matrix_left)[1]
        self.all_miss = self.number_mis_class_left
        right_his.append(self.number_mis_class_right)
        left_his.append(self.number_mis_class_left)
        print(right_his)
        print(left_his)
        print('Num of mis-classification on left leaf is:' + str(self.number_mis_class_left)
              + '    Num of mis-classification on right leaf is:' + str(self.number_mis_class_right))

    def caculate_mis_class(self, prop_right, prop_left):
        leaf_label_ind_left = np.argmax(prop_left)
        left_label_count = self.c_counts[leaf_label_ind_left]
        leaf_label_ind_right = np.argmax(prop_right)
        right_label_count = self.c_counts[leaf_label_ind_right]
        mis_class_left = self.left_x.shape[1] - round(left_label_count * prop_left[leaf_label_ind_left])
        mis_class_right = self.right_x.shape[1] - round(right_label_count * prop_right[leaf_label_ind_right])
        return mis_class_left, mis_class_right

