from sklearn.metrics import confusion_matrix
import sys
import matplotlib.pyplot as plt
from mlrefined_libraries.superlearn_library.multiclass_illustrator import Visualizer
from IPython.display import clear_output
from autograd import grad as compute_grad
from autograd import hessian as compute_hess
from autograd.misc.flatten import flatten_func
from mlrefined_libraries.math_optimization_library import static_plotter
import autograd.numpy as np
import time
import copy

plotter = static_plotter.Visualizer()

sys.path.append('../')


class multi_class_ml_function(Visualizer):
    def __init__(self, data, stdlize=True):
        Visualizer.__init__(self, data)
        data = data.T
        self.x = np.asarray(data[:, :-1])
        self.x.shape = (len(self.x), np.shape(data)[1] - 1);
        self.x = self.x.T
        self.y = data[:, -1]
        self.y.shape = (len(self.y), 1)
        self.w0 = self.decent_initializer()
        if stdlize:
            self.data_initialization()

    def data_initialization(self):
        # The whole data processing pipeline
        self.deviation_regulartor(self.x)
        x = self.data_recovery(self.x)
        self.x_mean = x.mean(axis=1)[:, np.newaxis]
        self.data_normalization(x)

    def data_normalization(self, x):
        # Generate the normalization function
        normalize = lambda x: (x - self.x_mean) / self.x_std
        self.x = normalize(x)

    def deviation_regulartor(self, x):
        self.x_std = np.nanstd(x, axis=1)[:, np.newaxis]
        regulator = np.zeros(self.x_std.shape)
        for i in range(len(self.x_std)):
            if self.x_std[i] <= 0.01:
                regulator[i] = 1.0
                self.x_std += regulator
            else:
                pass

    def decent_initializer(self):
        w = np.random.randn(np.shape(self.x)[0] + 1, len(np.unique(self.y)))
        return w

    def data_recovery(self, x):
        mean = np.nanmean(self.x, axis=1)
        for i in np.argwhere(np.isnan(x) == True):
            x[i[0], i[1]] = mean[i[0]]
        return x

    @staticmethod
    def sigmoid(t):
        return 1 / (1 + np.exp(-t))

    @staticmethod
    def linear_model(x, w):
        a = w[0] + np.dot(x.T, w[1:])
        return a.T

    # cost function
    def softmax(self, w):
        cost = 0
        for p in range(0, len(self.y_temp)):
            x_p = self.x[p]
            y_p = self.y_temp[p]
            a_p = w[0] + sum([a * b for a, b in zip(w[1:], x_p)])
            cost += np.log(1 + np.exp(-y_p * a_p))
        return cost

    def multiclass_perceptron(self, w):
        lam = 10 ** -5
        all_evals = self.linear_model(self.x, w)
        a = np.max(all_evals, axis=0)
        b = all_evals[self.y.astype(int).flatten(), np.arange(np.size(self.y))]
        cost = np.sum(a - b)
        cost = cost + lam * np.linalg.norm(w[1:, :], 'fro') ** 2
        return cost / float(np.size(self.y))

    def perceptron(self, w):
        cost = 0
        for p in range(0, len(self.y_temp)):
            x_p = self.x[p]
            y_p = self.y_temp[p]
            a_p = w[0] + sum([a * b for a, b in zip(w[1:], x_p)])
            cost += np.maximum(0, -y_p * a_p)
        return cost

    def newtons_method(self, g, **kwargs):
        w = self.w0
        flat_g, unflatten, w = flatten_func(g, w)
        self.grad = compute_grad(flat_g)
        self.hess = compute_hess(flat_g)
        max_its = 20
        if 'max_its' in kwargs:
            max_its = kwargs['max_its']
        self.epsilon = 10 ** (-5)
        if 'epsilon' in kwargs:
            self.epsilon = kwargs['epsilon']
        verbose = False
        if 'verbose' in kwargs:
            verbose = kwargs['verbose']
        w_hist = [unflatten(w)]
        if verbose:
            print('starting optimization...')

        geval_old = flat_g(w)
        for k in range(max_its):
            grad_val = self.grad(w)
            hess_val = self.hess(w)
            hess_val.shape = (np.size(w), np.size(w))
            w = w - np.dot(np.linalg.pinv(hess_val + self.epsilon * np.eye(np.size(w))), grad_val)
            geval_new = flat_g(w)
            if k > 2 and geval_new > geval_old:
                print('singular system reached')
                time.sleep(0.5)
                clear_output()
                return w_hist
            else:
                geval_old = geval_new
            w_hist.append(unflatten(w))

        if verbose:
            print('...optimization complete!')
            time.sleep(1.5)
            clear_output()

        return w_hist

    def gradient_descent(self, g, max_its, study_rate, **kwargs):
        w = self.w0
        self.grad = compute_grad(g)
        version = 'unnormalized'
        if 'version' in kwargs:
            version = kwargs['version']
        steplength_rule = 'none'
        if 'steplength_rule' in kwargs:
            steplength_rule = kwargs['steplength_rule']
        verbose = False
        if 'verbose' in kwargs:
            verbose = kwargs['verbose']
        weight_history = [w]
        cost_history = [g(w)]
        if verbose:
            print('starting optimization...')
        for k in range(max_its):
            grad_eval = self.grad(w)
            grad_eval.shape = np.shape(w)
            if version == 'normalized':
                grad_norm = np.linalg.norm(grad_eval)
                if grad_norm == 0:
                    grad_norm += 10 ** -6 * np.sign(2 * np.random.rand(1) - 1)
                grad_eval /= grad_norm
            if steplength_rule == 'backtracking':
                study_rate = self.backtracking(g, w, grad_eval)
            if steplength_rule == 'diminishing':
                study_rate = 1 / (float(k + 1))
            w = w - study_rate * grad_eval
            cost_history.append(g(w))
            weight_history.append(w)
        if verbose:
            print('...optimization complete!')
            time.sleep(1.0)
            clear_output()
        self.cost_history = cost_history
        return weight_history

    def backtracking(self, g, w, grad_eval):
        study_rate = 1
        t = 0.8
        func_eval = g(w)
        grad_norm = np.linalg.norm(grad_eval) ** 2
        while g(w - study_rate * grad_eval) > func_eval - study_rate * 0.5 * grad_norm:
            study_rate = t * study_rate
        return study_rate

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

    def OvA(self, Loss_function, iteration, study_rate, **kwargs):
        self.weight = []
        num_classes = np.size(np.unique(self.y))
        if Loss_function == 'softmax':
            Loss_fun = self.softmax
        if Loss_function == 'perceptron':
            Loss_fun = self.perceptron
        else:
            raise Exception('No such cost function')

        for i in range(num_classes):
            self.y_temp = copy.deepcopy(self.y)
            ind = np.argwhere(self.y_temp == i)
            ind = ind[:, 0]
            ind2 = np.argwhere(self.y_temp != i)
            ind2 = ind2[:, 0]
            self.y_temp[ind] = 1
            self.y_temp[ind2] = -1
            if 'opt' in kwargs:
                if kwargs['opt'] == 'gradient_descent':
                    weight_history = self.gradient_descent(g=Loss_fun, w=self.w0,
                                                           max_its=iteration, study_rate=study_rate)
                else:
                    weight_history = self.newtons_method(g=Loss_fun, w=self.w0,
                                                         max_its=iteration, study_rate=study_rate)
            else:
                raise Exception("Please choose an Optimization function")
            cost_history = []
            for j in range(len(weight_history)):
                w = weight_history[j]
                gval = Loss_fun(w)
                cost_history.append(gval)
            self.weight.append(self.weight_normalizer(weight_history[np.argmin(cost_history)]))

        self.weight = np.array(self.weight)
        self.weight.shape = (num_classes, np.shape(self.x)[1] + 1)

    def predict(self, w_trained):
        class_y = np.argmax(self.linear_model(self.x, w_trained), axis=0)
        distance_y = np.max(self.linear_model(self.x, w_trained), axis=0)
        return class_y

    def counting_mis_classification(self, weight_history):
        mismatching_his = []
        for w_p in weight_history:
            misclass = 0
            class_y = self.predict(w_p)
            for i, c in enumerate(class_y):
                if c != self.y[i, 0]:
                    misclass += 1
            mismatching_his.append(misclass)
        self.mismatching_his = mismatching_his


if __name__ == "__main__":
    data = np.loadtxt('../mlrefined_datasets/superlearn_datasets/3class_data.csv', delimiter=',')
    Q2 = multi_class_ml_function(data, stdlize=False)
    # Q2.show_dataset()
    weight_history = Q2.gradient_descent(g=Q2.multiclass_perceptron, max_its=200, study_rate=0.5)
    Q2.show_complete_coloring(weight_history, cost=Q2.multiclass_perceptron)
    Q2.counting_mis_classification(weight_history)
    plotter.plot_mismatching_histories(histories=[Q2.mismatching_his], start=0,
                                       labels=['$ multiclass perceptron $'],
                                       title="Misclassification History of 200 Iterations")
