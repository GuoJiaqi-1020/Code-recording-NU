import sys
import autograd.numpy as np
import autograd
from mlrefined_libraries.math_optimization_library import static_plotter
from sklearn.metrics import confusion_matrix
import matplotlib.pyplot as plt

plotter = static_plotter.Visualizer()
sys.path.append('../')


class basic_ml_function(object):
    def __init__(self, data_set, stdlize=True, beta=1):
        self.x = data_set[:-1, :]
        self.y = data_set[-1:, :]
        self.w0 = self.decent_initializer()
        if stdlize:
            self.data_initialization()
        self.mismatching_his = None
        self.balanced_acc = None
        self.beta = np.array([1.0, 1.0*beta])

    def data_initialization(self):
        # The whole data processing piplne
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
        w = 0.1 * np.random.randn(self.x.shape[0] + 1, 1)
        return w

    def data_recovery(self, x):
        mean = np.nanmean(self.x, axis=1)
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
        ind = np.argwhere(self.y == -1)[:, 1]
        cost = -self.beta[0] * np.sum(np.log(1 - a[:, ind]))
        ind = np.argwhere(self.y == 1)[:, 1]
        cost -= self.beta[1] * np.sum(np.log(a[:, ind]))
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
            Loss_fun = self.cross_entropy
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

    def newtons_method(self, Loss_function, iteration, **kwargs):
        if Loss_function == 'LSM':
            Loss_fun = self.least_squares_mean
        elif Loss_function == 'LAD':
            Loss_fun = self.least_absolute_deviations
        elif Loss_function == 'Softmax':
            Loss_fun = self.softmax
        elif Loss_function == 'Perceptron':
            Loss_fun = self.perceptron
        elif Loss_function == 'CrossEntropy':
            Loss_fun = self.cross_entropy
        else:
            raise Exception("Error Function Name")
        gradient = autograd.grad(Loss_fun)
        hess = autograd.hessian(Loss_fun)
        epsilon = 10 ** (-10)
        if 'epsilon' in kwargs:
            epsilon = kwargs['epsilon']
        w = self.w0
        weight_history = [np.array(w)]
        cost_history = [np.array(Loss_fun(w))]
        for k in range(iteration):
            grad_eval = gradient(w)
            hess_eval = hess(w)
            hess_eval.shape = (int((np.size(hess_eval)) ** 0.5), int((np.size(hess_eval)) ** 0.5))
            A = hess_eval + epsilon * np.eye(w.size)
            b = grad_eval
            w = np.linalg.solve(A, np.dot(A, w) - b)
            weight_history.append(np.array(w))
            cost_history.append(np.array(Loss_fun(w)))
        return weight_history, cost_history

    #  Result counting
    def predict(self, w_trained):
        y_pred = np.sign(self.linear_model(w_trained))
        return y_pred

    def balanced_accuracy(self, weight_history):
        misclass1 = []
        misclass2 = []
        ind = np.argmin(self.mismatching_his)
        w_p = weight_history[ind]
        index_class_1 = np.argwhere(self.y == -1)
        for count in range(index_class_1.shape[0]):
            if self.y[0][index_class_1[count][1]] == self.predict(w_p)[0][count]:
                misclass1.append(count)
        acc_1 = len(misclass1) / index_class_1.shape[0]
        index_class_2 = np.argwhere(self.y == 1)
        for count in range(index_class_2.shape[0]):
            if self.y[0][index_class_2[count][1]] == self.predict(w_p)[0][count]:
                misclass2.append(count)
        acc_2 = len(misclass2) / index_class_2.shape[0]
        self.balanced_acc = (acc_2 + acc_1) / 2

    def counting_mis_classification(self, weight_history):
        mismatching_his = []
        for w_p in weight_history:
            index = np.argwhere(self.y != self.predict(w_trained=w_p))
            mismatching_his.append(index.shape[0])
        self.mismatching_his = mismatching_his
        return mismatching_his

    # Plotting
    def confusion_matrix(self, weight_his, labels, normalize=False, title='Confusion Matrix', precision="%0.f"):
        self.counting_mis_classification(weight_his)
        ind = np.argmin(self.mismatching_his)
        w_p = weight_his[ind]
        tick_marks = np.array(range(len(labels))) + 0.5
        cm = confusion_matrix(self.y[0], self.predict(w_p)[0])
        if normalize:
            cm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
            title = "Normalized " + title
            precision = "%0.2f"
        plt.figure(figsize=(12, 8), dpi=120)
        ind_array = np.arange(len(labels))
        x, y = np.meshgrid(ind_array, ind_array)
        for x_val, y_val in zip(x.flatten(), y.flatten()):
            c = cm[y_val][x_val]
            if c > 0.0:
                plt.text(x_val, y_val, precision % (c,), color='k', fontsize=17, va='center', ha='center')
        plt.gca().set_xticks(tick_marks, minor=True)
        plt.gca().set_yticks(tick_marks, minor=True)
        plt.gca().xaxis.set_ticks_position('none')
        plt.gca().yaxis.set_ticks_position('none')
        plt.grid(True, which='minor', linestyle='-')
        plt.gcf().subplots_adjust(bottom=0.15)
        plt.imshow(cm, interpolation='nearest', cmap='Blues')
        plt.title(title)
        plt.colorbar()
        xlocations = np.array(range(len(labels)))
        plt.xticks(xlocations, labels, rotation=90)
        plt.yticks(xlocations, labels)
        plt.ylabel('True label')
        plt.xlabel('Predicted label')
        plt.show()


if __name__ == "__main__":
    data_3D = np.loadtxt('../mlrefined_datasets/superlearn_datasets/3d_classification_data_v2_mbalanced.csv',
                         delimiter=',')

    """
    Beta = 1
    """
    # JQ1 = basic_ml_function(data_3D, stdlize=False, beta=1)
    # weight_history_JQ2_Per, cost_history_JQ2_Per = JQ1.newtons_method('CrossEntropy', study_rate=0.1, iteration=10)
    # mismatch_his_Sof = JQ1.counting_mis_classification(weight_history_JQ2_Per)
    # JQ1.balanced_accuracy(weight_history_JQ2_Per)
    # plotter.plot_mismatching_histories(histories=[mismatch_his_Sof], start=0, labels=['$ Perceptron $'],
    #                                    title="Beta=1: Training Mis-classification History of 10 Iterations")
    # plotter.plot_cost_histories(histories=[cost_history_JQ2_Per], start=0, labels=['$ Perceptron $'],
    #                             title="Beta=1: Training Cost History of 10 Iterations")
    """
    Beta = 5
    """
    # JQ2 = basic_ml_function(data_3D, stdlize=False, beta=5)
    # weight_history_JQ2_Per, cost_history_JQ2_Per = JQ2.newtons_method('CrossEntropy', study_rate=0.1, iteration=10)
    # mismatch_his_Sof = JQ2.counting_mis_classification(weight_history_JQ2_Per)
    # JQ2.balanced_accuracy(weight_history_JQ2_Per)
    # plotter.plot_mismatching_histories(histories=[mismatch_his_Sof], start=0, labels=['$ Perceptron $'],
    #                                    title="Beta=5: Training Mis-classification History of 10 Iterations")
    # plotter.plot_cost_histories(histories=[cost_history_JQ2_Per], start=0, labels=['$ Perceptron $'],
    #                             title="Beta=5: Training Cost History of 10 Iterations")
    """
    Beta = 10
    """
    JQ3 = basic_ml_function(data_3D, stdlize=False, beta=10)
    weight_history_JQ2_Per, cost_history_JQ2_Per = JQ3.newtons_method('CrossEntropy', study_rate=0.1, iteration=10)
    mismatch_his_Sof = JQ3.counting_mis_classification(weight_history_JQ2_Per)
    JQ3.balanced_accuracy(weight_history_JQ2_Per)
    plotter.plot_mismatching_histories(histories=[mismatch_his_Sof], start=0, labels=['$ Perceptron $'],
                                       title="Beta=10: Training Mis-classification History of 10 Iterations")
    plotter.plot_cost_histories(histories=[cost_history_JQ2_Per], start=0, labels=['$ Perceptron $'],
                                title="Training Cost History of 10 Iterations")

