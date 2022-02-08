import sys
import autograd.numpy as np
from sklearn.datasets import fetch_openml
from mlrefined_libraries.nonlinear_superlearn_library.early_stop_lib import multilayer_perceptron, optimizers, \
    cost_functions, history_plotters

sys.path.append('../')


class Handwritten_digit_DL:
    def __init__(self, x_sample, y_sample, layer_size):
        self.x = x_sample
        self.y = y_sample
        # define the parameter
        self.weight_histories = []
        self.train_cost_histories = []
        self.train_count_histories = []
        self.val_cost_histories = []
        self.val_count_histories = []
        # training process
        self.train_main(layer_size)

    def train_main(self, layer_size):
        self.data_preprocess()
        self.split_dataset(train_portion=0.83)
        self.parameter_setting(name='multilayer_perceptron', layer_sizes=layer_size,
                               activation='maxout', scale=0.1)
        self.cost_fun(name='multiclass_softmax')
        self.fit(max_its=80, alpha_choice=10 ** (-1), batch_size=500)
        self.plot_history()

    def normalize(self, x):
        x_means = np.mean(x, axis=1)[:, np.newaxis]
        x_stds = np.std(x, axis=1)[:, np.newaxis]
        ind = np.argwhere(x_stds < 10 ** (-2))
        if len(ind) > 0:
            ind = [v[0] for v in ind]
            adjust = np.zeros(x_stds.shape)
            adjust[ind] = 1.0
            x_stds += adjust
        self.normalizer = lambda data: (data - x_means) / x_stds

    def data_preprocess(self):
        self.normalize(self.x)
        self.x = self.normalizer(self.x)

    def split_dataset(self, train_portion):
        self.train_portion = train_portion
        r = np.random.permutation(self.x.shape[1])
        train_num = int(np.round(train_portion * len(r)))
        self.train_inds = r[:train_num]
        self.val_inds = r[train_num:]
        self.x_train = self.x[:, self.train_inds]
        self.x_val = self.x[:, self.val_inds]
        self.y_train = self.y[:, self.train_inds]
        self.y_val = self.y[:, self.val_inds]

    def cost_fun(self, name, **kwargs):
        funcs = cost_functions.Setup(name, self.feature_transforms, **kwargs)
        self.full_cost = funcs.cost
        self.full_model = funcs.model
        funcs = cost_functions.Setup(name, self.feature_transforms, **kwargs)
        self.cost = funcs.cost
        self.model = funcs.model
        funcs = cost_functions.Setup('multiclass_accuracy', self.feature_transforms, **kwargs)
        self.counter = funcs.cost
        self.cost_name = name

    def parameter_setting(self, name, **kwargs):
        self.transformer = multilayer_perceptron.Setup(**kwargs)
        self.feature_transforms = self.transformer.feature_transforms
        self.initializer = self.transformer.initializer
        self.layer_sizes = self.transformer.layer_sizes
        self.feature_name = name

    def fit(self, **kwargs):
        if 'max_its' in kwargs:
            self.max_its = kwargs['max_its']
        if 'alpha_choice' in kwargs:
            self.alpha_choice = kwargs['alpha_choice']
        self.w_init = self.initializer()
        self.num_pts = np.size(self.y_train)
        self.batch_size = np.size(self.y_train)
        if 'batch_size' in kwargs:
            self.batch_size = min(kwargs['batch_size'], self.batch_size)
        weight_history, train_cost_history, train_count_hist, val_cost_history, val_count_history = optimizers.gradient_descent(
            self.cost, self.counter, self.x_train, self.y_train, self.x_val, self.y_val, self.alpha_choice,
            self.max_its, self.w_init, self.num_pts, self.batch_size, verbose="True", version="standard")

        self.weight_histories.append(weight_history)
        self.train_cost_histories.append(train_cost_history)
        self.train_count_histories.append(train_count_hist)
        self.val_cost_histories.append(val_cost_history)
        self.val_count_histories.append(val_count_history)

    def result_validation(self, x_test, y_test):
        ind = np.argmax(self.val_count_histories[0])
        best_val = self.val_count_histories[0][ind]
        best_train = self.train_count_histories[0][ind]
        print("Training set ACC:{} Validation set ACC:{}".format(best_train, best_val))

        w_best = self.weight_histories[0][ind]
        test_evals = self.model(x_test, w_best)
        y_hat = (np.argmax(test_evals, axis=0))[np.newaxis, :]
        misses = np.argwhere(y_hat != y_test)
        acc = 1 - (misses.size / y_test.size)
        print("The test set accuracy is: {}".format(acc))

    def plot_history(self):
        plotter = history_plotters.Setup(self.train_cost_histories, self.train_count_histories, self.val_cost_histories,
                               self.val_count_histories, start=0)



if __name__ == "__main__":
    layer_sizes = [784, 100, 100, 10]
    x, y = fetch_openml('mnist_784', version=1, return_X_y=True)
    y = np.array([int(v) for v in y])[np.newaxis, :]
    num_sample = 60000
    inds = np.random.permutation(y.shape[1])
    train_set = inds[:num_sample]
    x_sample = np.array(x.T)[:, train_set]
    y_sample = y[:, train_set]
    print("x train shape = ", x_sample.shape)
    print("y train shape = ", y_sample.shape)

    test_set = inds[num_sample:]
    x_test = np.array(x.T)[:, test_set]
    y_test = y[:, test_set]
    print("x test shape = ", x_test.shape)
    print("y test shape = ", y_test.shape)

    NA = Handwritten_digit_DL(x_sample, y_sample, layer_sizes)
    NA.result_validation(x_test, y_test)
