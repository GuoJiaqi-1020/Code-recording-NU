import sys
import edgebased_feature_extractor
from mlrefined_libraries.math_optimization_library import static_plotter
import autograd.numpy as np
from autograd.misc.flatten import flatten_func
from autograd import grad as gradient
from timeit import default_timer as timer
from sklearn.datasets import fetch_openml
sys.path.append('..')

plotter = static_plotter.Visualizer()

sys.path.append('../')


def linear_model(x, w):
    a = w[0] + np.dot(x.T, w[1:])
    return a.T


def multiclass_perceptron(w, x, y, iter):
    # get subset of points
    x_p = x[:, iter]
    y_p = y[:, iter]
    # pre-compute predictions on all points
    all_evals = linear_model(x_p, w)
    # compute maximum across data points
    a = np.max(all_evals, axis=0)
    # compute cost in compact form using numpy broadcasting
    b = all_evals[y_p.astype(int).flatten(), np.arange(np.size(y_p))]
    cost = np.sum(a - b)
    # return average
    return cost / float(np.size(y_p))


class multi_class_ml_function(object):
    def __init__(self, x, y, n_sample):
        self.x = np.array(x.T)
        self.y = np.array([int(value) for value in y])[np.newaxis, :]
        # self.w0 = self.decent_initializer()
        self.shuffle_data(n_sample)
        self.data_initialization()
        self.x_edge = self.edge_feature_extract(self.x)
        self.mismatching_his = None

    def decent_initializer(self, x):
        w = np.random.randn(np.shape(x)[0] + 1, len(np.unique(self.y)))
        return w

    @staticmethod
    def edge_feature_extract(x):
        kernels = np.array([
            [[-1, -1, -1],
             [0, 0, 0],
             [1, 1, 1]],

            [[-1, -1, 0],
             [-1, 0, 1],
             [0, 1, 1]],

            [[-1, 0, 1],
             [-1, 0, 1],
             [-1, 0, 1]],

            [[0, 1, 1],
             [-1, 0, 1],
             [-1, -1, 0]],

            [[1, 0, -1],
             [1, 0, -1],
             [1, 0, -1]],

            [[0, -1, -1],
             [1, 0, -1],
             [1, 1, 0]],

            [[1, 1, 1],
             [0, 0, 0],
             [-1, -1, -1]],

            [[1, 1, 0],
             [1, 0, -1],
             [0, -1, -1]]])
        extractor = edgebased_feature_extractor.tensor_conv_layer()
        x_transformed = extractor.conv_layer(x.T, kernels).T
        return x_transformed

    def shuffle_data(self, n_sample):
        inds = np.random.permutation(y.shape[0])[:n_sample]
        self.x = self.x[:, inds]
        self.y = self.y[:, inds]

    def data_initialization(self):
        # The whole data processing pipeline
        self.deviation_regulartor(self.x)
        x = self.data_recovery(self.x)
        self.x_mean = np.nanmean(x.T, axis=1)[:, np.newaxis]
        self.data_normalization(x)

    def deviation_regulartor(self, x):
        self.x_std = np.nanstd(x.T, axis=1)[:, np.newaxis]
        regulator = np.zeros(self.x_std.shape)
        for i in range(len(self.x_std)):
            if self.x_std[i] <= 0.01:
                regulator[i] = 1.0
                self.x_std += regulator
            else:
                pass

    def data_normalization(self, x):
        # Generate the normalization function
        normalize = lambda x: (x - self.x_mean) / self.x_std
        self.x = normalize(x.T).T

    def data_recovery(self, x):
        mean = np.nanmean(self.x, axis=1)
        for i in np.argwhere(np.isnan(x) == True):
            x[i[0], i[1]] = mean[i[0]]
        return x

    def gradient_descent(self, loss_fun, x_train, y_train, alpha, max_its, batch_size, **kwargs):
        w = self.decent_initializer(x_train)
        verbose = True
        if 'verbose' in kwargs:
            verbose = kwargs['verbose']
        g_flat, unflatten, w = flatten_func(loss_fun, w)
        grad = gradient(g_flat)
        num_train = y_train.size
        w_hist = [unflatten(w)]
        train_hist = [g_flat(w, x_train, y_train, np.arange(num_train))]
        num_batches = int(np.ceil(np.divide(num_train, batch_size)))
        for k in range(max_its):
            start = timer()
            train_cost = 0
            for b in range(num_batches):
                # collect indices of current mini-batch
                batch_inds = np.arange(b * batch_size, min((b + 1) * batch_size, num_train))

                # plug in value into func and derivative
                grad_eval = grad(w, x_train, y_train, batch_inds)
                grad_eval.shape = np.shape(w)
                w = w - alpha * grad_eval

            end = timer()

            train_cost = g_flat(w, x_train, y_train, np.arange(num_train))
            w_hist.append(unflatten(w))
            train_hist.append(train_cost)

            if verbose:
                print('step ' + str(k + 1) + ' done in ' + str(np.round(end - start, 1)) + ' secs, train cost = ' + str(
                    np.round(train_hist[-1][0], 4)))

        if verbose:
            print('finished all ' + str(max_its) + ' steps')
            # time.sleep(1.5)
            # clear_output()
        return w_hist, train_hist

    # Others
    def one_versus_others_seperator(self, label):
        y = self.y
        y[np.argwhere(self.y == label)[:, 0]] = 1
        y[np.argwhere(self.y != label)[:, 0]] = -1
        return y

    @staticmethod
    def weight_normalizer(w):
        w_norm = sum([v ** 2 for v in w[1:]]) ** 0.5
        return [v / w_norm for v in w]

    def predict(self, x, w_trained):
        class_y = np.argmax(linear_model(x, w_trained), axis=0)
        return class_y

    def counting_mis_classification(self, x, weight_history):
        mismatching_his = []
        for w_p in weight_history:
            count = 0
            class_y = self.predict(x, w_p)
            count = np.sum(np.argwhere(self.y != class_y))
            mismatching_his.append(count)
            print(count)
        self.mismatching_his = mismatching_his
        return mismatching_his


if __name__ == "__main__":
    x, y = fetch_openml('mnist_784', version=1, return_X_y=True)
    minist = multi_class_ml_function(x, y, n_sample=50000)
    weight_his, cost_his = minist.gradient_descent(multiclass_perceptron, minist.x, minist.y, alpha=0.01,
                                                   max_its=75,
                                                   x=minist.x, batch_size=200, verbose=True)
    weight_edge_his, cost_edge_his = minist.gradient_descent(multiclass_perceptron, minist.x_edge, minist.y,
                                                             alpha=0.01, max_its=75,
                                                             x=minist.x_edge, batch_size=200, verbose=True)
    mis1 = minist.counting_mis_classification(minist.x, weight_his)
    mis2 = minist.counting_mis_classification(minist.x_edge, weight_edge_his)
    plotter.plot_mismatching_histories(histories=[mis1, mis2], start=0,
                                       labels=['raw', 'edge-based'],
                                       title="Training Mis-classification History of 75 Iterations")
    plotter.plot_cost_histories(histories=[cost_his, cost_edge_his], start=0,
                                labels=['raw', 'edge-based'],
                                title="Cost History of 75 Iterations")
