from matplotlib import pyplot as plt, gridspec

from mlrefined_libraries.nonlinear_superlearn_library.kernel_visualizer import Visualizer
from mlrefined_libraries.nonlinear_superlearn_library.kernel_lib.kernels import Setup as K_setup
import autograd.numpy as np
from mlrefined_libraries.math_optimization_library import static_plotter
import copy
from autograd import value_and_grad
from autograd import hessian
from autograd.misc.flatten import flatten_func

plotter = static_plotter.Visualizer()


class two_class_with_RBF_kernel(object):
    def __init__(self, file_path):
        self.models = []
        self.train_cost_histories = []
        self.weight_histories = []
        data = np.loadtxt(file_path, delimiter=',')
        self.x = copy.deepcopy(data[:-1, :])
        self.y = copy.deepcopy(data[-1:, :])

    def decent_ini(self):
        self.w0 = 0.05 * np.random.randn(np.size(self.y) + 1, 1)

    def normalization(self):
        x_means = np.nanmean(self.x, axis=1)[:, np.newaxis]
        x_stds = np.nanstd(self.x, axis=1)[:, np.newaxis]
        ind = np.argwhere(x_stds < 10 ** (-2))
        if len(ind) > 0:
            ind = [v[0] for v in ind]
            adjust = np.zeros((x_stds.shape))
            adjust[ind] = 1.0
            x_stds += adjust
        self.normalizer = lambda data: (data - x_means) / x_stds
        self.x = self.normalizer(self.x)

    def kernel(self, name, **kwargs):
        self.transformer = K_setup(name, **kwargs)
        self.H_train = self.transformer.kernel(self.x_train, self.x_train)
        self.H = lambda x: self.transformer.kernel(self.x_train, x)

    def add_kernel_to_cost(self):
        self.train_cost = lambda w, iter: self.softmax(w, self.H_train, self.y_train, iter)
        self.model = lambda x, w: w[0] + np.dot(self.H(x), w[1:])

    def linear_model(self, f, w):
        a = w[0] + np.dot(f.T, w[1:])
        return a.T

    def counting_mis_classification(self, w, x, y):
        y_predict = np.sign(self.linear_model(x, w))
        num_misclass = len(np.argwhere(y != y_predict))
        return num_misclass

    def softmax(self, w, H, y, iter):
        f_p = H[:, iter]
        y_p = y[:, iter]
        cost = np.sum(np.log(1 + np.exp(-y_p * self.linear_model(f_p, w))))
        return cost / float(np.size(y_p))

    def dataset_split(self, train_portion):
        shuffled_data = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion * len(shuffled_data)))
        self.train_inds = shuffled_data[:train_num]
        self.valid_inds = shuffled_data[train_num:]

        self.x_train = self.x[:, self.train_inds]
        self.x_valid = self.x[:, self.valid_inds]

        self.y_train = self.y[:, self.train_inds]
        self.y_valid = self.y[:, self.valid_inds]

    def newtons_method(self, g, max_its, w, num_pts, batch_size, epsilon):
        g_flat, unflatten, w = flatten_func(g, w)
        gradient = value_and_grad(g_flat)
        hess = hessian(g_flat)
        train_hist = [g_flat(w, np.arange(num_pts))]
        w_hist = [unflatten(w)]
        num_batches = int(np.ceil(np.divide(num_pts, batch_size)))
        for k in range(max_its):
            print('running iteration:' + str(k + 1) + ' of ' + str(max_its))
            for b in range(num_batches):
                batch_inds = np.arange(b * batch_size, min((b + 1) * batch_size, num_pts))
                cost_eval, grad_eval = gradient(w, batch_inds)
                hess_eval = hess(w, batch_inds)
                hess_eval.shape = (int((np.size(hess_eval)) ** 0.5), int((np.size(hess_eval)) ** 0.5))
                A = hess_eval + epsilon * np.eye(np.size(w))
                b = grad_eval
                w = np.linalg.lstsq(A, np.dot(A, w) - b)[0]
            w_hist.append(unflatten(w))
            train_hist.append(g_flat(w, np.arange(num_pts)))
        return w_hist, train_hist

    def train(self, max_its, epsilon, beta):
        self.mis_class = []
        self.normalization()
        self.dataset_split(1)
        self.decent_ini()
        self.add_kernel_to_cost()
        self.kernel(name='gaussian', beta=beta, scale=0)
        self.num_pts = np.size(self.y_train)
        self.batch_size = np.size(self.y_train)
        w_his, c_his = self.newtons_method(self.train_cost, max_its, self.w0, self.num_pts, self.batch_size, epsilon)
        self.weight_histories.append(w_his)
        self.train_cost_histories.append(c_his)
        for w in w_his:
            self.mis_class.append(self.counting_mis_classification(w, self.H_train, self.y_train))
        self.models.append(copy.deepcopy(self))


def plot_mismatching_histories(histories, start, title='', **kwargs):
    colors = ['black', 'aqua', 'magenta', 'k', 'chocolate']
    fig = plt.figure(figsize=(10, 5))
    gs = gridspec.GridSpec(1, 1)
    ax = plt.subplot(gs[0])
    labels = [' ', ' ', ' ']
    if 'labels' in kwargs:
        labels = kwargs['labels']
    points = False
    if 'points' in kwargs:
        points = kwargs['points']
    for c in range(len(histories)):
        history = histories[c]
        label = 0
        if c == 0:
            label = labels[0]
        elif c == 1:
            label = labels[1]
        else:
            label = labels[2]
        x_axis = np.arange(start, len(history), 1)
        ind = np.argmin(history)
        plt.scatter(x_axis[ind], history[ind], color='r', zorder=2)
        plt.text(x_axis[ind] + 0.5, history[ind] + 1, '%.0f' % history[ind], fontsize=15, ha='left', va='bottom',
                 color='r')
        if np.size(label) == 0:
            ax.plot(x_axis, history[start:], linewidth=3 * 0.8 ** c, color=colors[c], zorder=1)
        else:
            ax.plot(x_axis, history[start:], linewidth=3 * 0.8 ** c, color=colors[c],
                    label=label, zorder=1)
        if points:
            ax.scatter(np.arange(start, len(history), 1), history[start:], s=90, color=colors[c], edgecolor='w',
                       linewidth=2, zorder=3)
    xlabel = 'step $k$'
    if 'xlabel' in kwargs:
        xlabel = kwargs['xlabel']
    ylabel = '$Number\ of\ misclassification$'
    if 'ylabel' in kwargs:
        ylabel = kwargs['ylabel']
    ax.set_xlabel(xlabel, fontsize=14)
    ax.set_ylabel(ylabel, fontsize=10, rotation=90, labelpad=25)
    if np.size(label) > 0:
        anchor = (1, 1)
        if 'anchor' in kwargs:
            anchor = kwargs['anchor']
        # plt.legend(loc='upper right', bbox_to_anchor=anchor)
    plt.xticks(range(0, len(history), int(len(history) / 10)))
    ax.set_xlim([start - 0.5, len(history) - 0.5])
    plt.title(title, fontsize=16)
    plt.show()


if __name__ == "__main__":
    file_path = '../mlrefined_datasets/nonlinear_superlearn_datasets/new_circle_data.csv'
    betas = [10 ** (-8), 10 ** (-4), 10 ** 1]
    label = [r'$\beta =10^{-8}$', r'$\beta =10^{-4}$', r'$\beta =10$']
    models = []
    mis_his = []
    ind = 0
    for beta in betas:
        RBF = two_class_with_RBF_kernel(file_path)
        RBF.train(max_its=10, epsilon=10 ** (-10), beta=beta)
        models.append(copy.deepcopy(RBF))
        mis_his.append(RBF.mis_class)
        plot_mismatching_histories(histories=[RBF.mis_class], start=0, title='Mis-classification  ' + str(label[ind]))
        ind += 1

    result = Visualizer(file_path)
    result.show_twoclass_runs(models, labels=label)
