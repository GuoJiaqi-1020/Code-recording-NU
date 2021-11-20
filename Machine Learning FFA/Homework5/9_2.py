import sys
from mlrefined_libraries.math_optimization_library import static_plotter
import autograd.numpy as np
from autograd.misc.flatten import flatten_func
from autograd import grad as gradient
import edge_extract
from sklearn.datasets import fetch_openml

sys.path.append('..')

plotter = static_plotter.Visualizer()


def linear_model(x, w):
    a = w[0] + np.dot(x.T, w[1:])
    return a.T


def multiclass_softmax(w, x, y, iter):
    x_p = x[:, iter]
    y_p = y[:, iter]
    all_evals = linear_model(x_p, w)
    a = np.log(np.sum(np.exp(all_evals), axis=0))
    b = all_evals[y_p.astype(int).flatten(), np.arange(np.size(y_p))]
    cost = np.sum(a - b)
    return cost / float(np.size(y_p))


# def multiclass_perceptron(w, x, y, iter):
#     # get subset of points
#     x_p = x[:, iter]
#     y_p = y[:, iter]
#     # pre-compute predictions on all points
#     all_evals = linear_model(x_p, w)
#     # compute maximum across data points
#     a = np.max(all_evals, axis=0)
#     # compute cost in compact form using numpy broadcasting
#     b = all_evals[y_p.astype(int).flatten(), np.arange(np.size(y_p))]
#     cost = np.sum(a - b)
#     # return average
#     return cost / float(np.size(y_p))


class MNIST_Classification(object):
    def __init__(self, n_sample):
        x, y = fetch_openml('mnist_784', version=1, return_X_y=True)
        self.x = x.T
        self.y = np.array([int(v) for v in y])[np.newaxis, :]
        self.shuffle_data(n_sample, self.x, self.y)
        self.standard_normalizer(self.x_rand.T)
        self.x_rand = self.normalizer(self.x_rand.T).T
        self.x_edge = self.hog_extractor(self.x_rand)
        self.cost_function = multiclass_softmax
        self.mismatching_his = None

    def shuffle_data(self, n_sample, x, y):
        inds = np.random.permutation(y.shape[1])[:n_sample]
        self.x_rand = np.array(x)[:, inds]
        self.y_rand = y[:, inds]

    def standard_normalizer(self, x):
        x_ave = np.nanmean(x, axis=1)[:, np.newaxis]
        x_std = np.nanstd(x, axis=1)[:, np.newaxis]
        self.normalizer = lambda data: (data - x_ave) / x_std

    @staticmethod
    def hog_extractor(x):
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
        extractor = edge_extract.tensor_conv_layer()
        x_transformed = extractor.conv_layer(x.T, kernels).T
        return x_transformed

    def gradient_descent(self, loss_fun, w, x_train, y_train, alpha, max_its, batch_size):
        g_flat, unflatten, w = flatten_func(loss_fun, w)
        grad = gradient(g_flat)
        num_train = y_train.size
        w_hist = [unflatten(w)]
        train_hist = [g_flat(w, x_train, y_train, np.arange(num_train))]
        num_batches = int(np.ceil(np.divide(num_train, batch_size)))
        for k in range(max_its):
            for b in range(num_batches):
                batch_inds = np.arange(b * batch_size, min((b + 1) * batch_size, num_train))
                grad_eval = grad(w, x_train, y_train, batch_inds)
                grad_eval.shape = np.shape(w)
                w = w - alpha * grad_eval
            train_cost = g_flat(w, x_train, y_train, np.arange(num_train))
            w_hist.append(unflatten(w))
            train_hist.append(train_cost)
        return w_hist, train_hist


    @staticmethod
    def weight_normalizer(w):
        w_norm = sum([v ** 2 for v in w[1:]]) ** 0.5
        return [v / w_norm for v in w]

    def predict(self, x, w_trained):
        class_y = np.argmax(linear_model(x, w_trained), axis=0)
        return class_y

    @staticmethod
    def misclass_cost(w, x, y):
        all_evals = linear_model(x, w)
        y_predict = (np.argmax(all_evals, axis=0))[np.newaxis, :]
        count = np.sum(np.argwhere(y != y_predict))
        return count


if __name__ == "__main__":
    mnist = MNIST_Classification(n_sample=50000)
    N = mnist.x_rand.shape[0]
    C = len(np.unique(mnist.y_rand))
    w = 0.1 * np.random.randn(N + 1, C)
    weight_his, cost_his = mnist.gradient_descent(mnist.cost_function, w, mnist.x_rand, mnist.y_rand, alpha=0.01,
                                                  max_its=20, batch_size=200)
    N = mnist.x_edge.shape[0]
    w = 0.1 * np.random.randn(N + 1, C)
    weight_edge_his, cost_edge_his = mnist.gradient_descent(mnist.cost_function, w, mnist.x_edge, mnist.y_rand,
                                                            alpha=0.01,
                                                            max_its=20, batch_size=200)
    mis1 = [a / 25000 for a in [mnist.misclass_cost(v, mnist.x_rand, mnist.y_rand) for v in weight_his]]
    mis2 = [a / 25000 for a in
            [mnist.misclass_cost(v, mnist.x_edge, mnist.y_rand) for v in weight_edge_his]]

    plotter.plot_mismatching_histories(histories=[mis1, mis2], start=1,
                                       labels=['raw', 'edge-based'],
                                       title="Training Mis-classification History")
    plotter.plot_cost_histories(histories=[cost_his, cost_edge_his], start=0,
                                labels=['raw', 'edge-based'],
                                title="Training Cost History")
