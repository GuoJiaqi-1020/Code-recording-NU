import sys
import autograd.numpy as np
import autograd
from mlrefined_libraries.math_optimization_library import static_plotter

plotter = static_plotter.Visualizer()
sys.path.append('../')


class basic_ml_function(object):
    def __init__(self, data_set, stdlize=True):
        self.x = data_set[:-1, :]
        self.y = data_set[-1:, :]
        self.x_std = self.x.std(axis=1)[:, np.newaxis]
        self.x_mean = self.x.mean(axis=1)[:, np.newaxis]
        self.w0 = self.decent_initializer()
        if stdlize:
            self.data_initialization(data_set)

    def data_initialization(self):
        # The whole data processing piplne
        self.x_mean = np.nanmean(self.x, axis=1)
        x = self.data_recovery(self.x, self.x_mean)
        self.deviation_regulartor()
        self.x_mean = x.mean(axis=1)[:, np.newaxis]
        self.data_normalization(x)

    def data_normalization(self, x):
        # Generate the normalization function
        normalize = lambda x: (x - self.x_mean) / self.x_std
        self.x = normalize(x)
        return normalize

    def deviation_regulartor(self):
        regulator = np.zeros(self.x_std.shape)
        for i in range(len(self.x_std)):
            if self.x_std[i] <= 0.1:
                regulator[i] = 1.0
                self.x_std += regulator
            else:
                pass

    def decent_initializer(self):
        w = 0.1 * np.random.randn(self.x.shape[0] + 1, 1)
        return w

    @staticmethod
    def data_recovery(x, mean):
        for i in np.argwhere(np.isnan(x) == True):
            x[i[0], i[1]] = mean[i[0]]
        return x

    @staticmethod
    def sigmoid(t):
        return 1 / (1 + np.exp(-t))

    def linear_model(self, w):
        a = w[0] + np.dot(self.x.T, w[1:])
        return a.T

    # cost function
    def softmax(self, w):
        cost = np.sum(np.log(1 + np.exp(-self.y * self.linear_model(w))))
        return cost / float(np.size(self.y))

    def perceptron(self, w):
        cost = np.sum(np.maximum(0, -self.y * self.linear_model(w)))
        return cost / float(np.size(self.y))

    def least_squares_mean(self, w):
        cost = np.sum((self.linear_model(w) - self.y) ** 2)
        return cost / float(np.size(self.y))

    def least_absolute_deviations(self, w):
        cost = np.sum(np.abs(self.linear_model(w) - self.y))
        return cost / float(np.size(self.y))

    def cross_entropy(self, w):
        a = self.sigmoid(self.linear_model(w))
        ind = np.argwhere(self.y == 0)[:, 1]
        cost = -np.sum(np.log(1 - a[:, ind]))
        ind = np.argwhere(self.y == 1)[:, 1]
        cost -= np.sum(np.log(a[:, ind]))
        return cost / self.y.size

    # Optimization function
    def gradient_decent(self, Loss_function, study_rate, iteration):
        """
        Gradient decent to minimize the cost function
        """
        if Loss_function == 'LSM':
            Loss_fun = self.least_squares_mean
        elif Loss_function == 'LAD':
            Loss_fun = self.least_absolute_deviations
        elif Loss_function == 'Softmax':
            Loss_fun = self.softmax
        elif Loss_function == 'Perceptron':
            Loss_fun = self.perceptron
        elif Loss_function == 'CrossEntropy':
            Loss_fun = self.perceptron
        else:
            raise Exception("Error Function Name")
        w = self.w0
        Gradient = autograd.grad(Loss_fun)
        weight_history = [w]
        cost_history = [Loss_fun(w)]
        for k in range(1, iteration + 1):
            grad_decent = Gradient(w)
            w = w - study_rate * grad_decent
            weight_history.append(w)
            cost_history.append(Loss_fun(w))
        if Loss_function == "LSM":
            cost_history = [cost ** 0.5 for cost in cost_history]
        return weight_history, cost_history

    def predict(self, w_trained):
        predicted_y = np.sign(self.linear_model(w_trained))
        return predicted_y

    def counting_mis_classification(self, weight_history):
        mismatching_his = []
        for w_p in weight_history:
            index = np.argwhere(self.y != self.predict(w_trained=w_p))
            mismatching_his.append(index.shape[0])
        return mismatching_his


if __name__ == "__main__":
    data_bcd = np.loadtxt('../mlrefined_datasets/superlearn_datasets/breast_cancer_data.csv', delimiter=',')
    BCD = basic_ml_function(data_bcd, stdlize=False)
    weight_history_BCD_Per, cost_history_BCD_Per = BCD.gradient_decent('Perceptron', study_rate=0.1, iteration=1000)
    weight_history_BCD_Sof, cost_history_BCD_Sof = BCD.gradient_decent('Softmax', study_rate=0.5, iteration=1000)
    mismatch_his_Per = BCD.counting_mis_classification(weight_history_BCD_Per)
    mismatch_his_Sof = BCD.counting_mis_classification(weight_history_BCD_Sof)
    plotter.plot_mismatching_histories(histories=[mismatch_his_Per, mismatch_his_Sof], start=0,
                                       labels=['$ Perceptron $', '$ Softmax $'],
                                       title="BR Dataset: Mis-Classification History of 1000 Iterations")
    plotter.plot_cost_histories(histories=[cost_history_BCD_Per, cost_history_BCD_Sof], start=0,
                                labels=['$ Perceptron $', '$ Softmax $'],
                                title="BR Dataset: Cost History of 1000 Iterations")
    mini_percept = np.min(mismatch_his_Per)
    mini_soft = np.min(mismatch_his_Sof)
    print('mini_per：' + str(mini_percept) + "mini_soft:" + str(mini_soft))
