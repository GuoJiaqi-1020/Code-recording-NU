import sys
import autograd.numpy as np
from matplotlib import pyplot as plt, gridspec

from mlrefined_libraries.nonlinear_superlearn_library.early_stop_lib import multilayer_perceptron
from mlrefined_libraries.nonlinear_superlearn_library.early_stop_regression_animator import Visualizer
from mlrefined_libraries.nonlinear_superlearn_library.reg_lib import cost_functions, super_optimizers, history_plotters, \
    super_cost_functions

sys.path.append('../')


class Early_Stop:
    def __init__(self, filename, layer_size):
        data = np.loadtxt(filename, delimiter=",")
        x = data[:-1, :]
        y = data[-1:, :]

        self.x = x
        self.y = y

        # make containers for all histories
        self.weight_histories = []
        self.train_cost_histories = []
        self.train_count_histories = []
        self.valid_cost_histories = []
        self.valid_count_histories = []
        self.train_costs = []
        self.train_counts = []
        self.valid_costs = []
        self.valid_counts = []
        self.train_main(layer_size)

    def train_main(self,layer_size):
        # training process
        self.data_preprocess()
        self.split_dataset(train_portion=0.66)
        self.choose_cost(name='least_squares')
        self.choose_features(name='multilayer_perceptron', layer_sizes=layer_size, activation='tanh')
        self.fit()
        self.show_histories()

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
        self.valid_inds = r[train_num:]
        self.x_train = self.x[:, self.train_inds]
        self.x_valid = self.x[:, self.valid_inds]
        self.y_train = self.y[:, self.train_inds]
        self.y_valid = self.y[:, self.valid_inds]

    def choose_cost(self, name, **kwargs):
        # create training and testing cost functions
        self.cost_object = super_cost_functions.Setup(name, **kwargs)
        if name == 'softmax' or name == 'perceptron':
            self.count_object = super_cost_functions.Setup('twoclass_counter', **kwargs)
        if name == 'multiclass_softmax' or name == 'multiclass_perceptron':
            self.count_object = super_cost_functions.Setup('multiclass_counter', **kwargs)
        self.cost_name = name

        if name == 'multiclass_softmax' or name == 'multiclass_perceptron':
            funcs = cost_functions.Setup('multiclass_accuracy', self.feature_transforms, **kwargs)
            self.counter = funcs.cost

        self.cost_name = name

    def choose_features(self, name, **kwargs):
        transformer = multilayer_perceptron.Setup(**kwargs)
        self.feature_transforms = transformer.feature_transforms
        self.initializer = transformer.initializer
        self.layer_sizes = transformer.layer_sizes
        self.feature_name = name
        self.cost_object.define_feature_transform(self.feature_transforms)
        self.cost = self.cost_object.cost
        self.model = self.cost_object.model

    def fit(self, **kwargs):
        self.max_its = 10000
        self.alpha_choice = 10**(-3)
        self.lam = 0
        self.algo = 'RMSprop'
        self.w_init = self.initializer()
        self.train_num = np.size(self.y_train)
        self.valid_num = np.size(self.y_valid)
        self.batch_size = np.size(self.y_train)
        if 'batch_size' in kwargs:
            self.batch_size = min(kwargs['batch_size'], self.batch_size)
        verbose = True
        if 'verbose' in kwargs:
            verbose = kwargs['verbose']
        weight_history, train_cost_history, valid_cost_history = super_optimizers.RMSprop(self.cost, self.w_init,
                                                                                          self.x_train,
                                                                                          self.y_train,
                                                                                          self.x_valid,
                                                                                          self.y_valid,
                                                                                          self.alpha_choice,
                                                                                          self.max_its,
                                                                                          self.batch_size, verbose,
                                                                                          self.lam)
        self.weight_histories.append(weight_history)
        self.train_cost_histories.append(train_cost_history)
        self.valid_cost_histories.append(valid_cost_history)

    def show_histories(self, **kwargs):
        start = 0
        if 'start' in kwargs:
            start = kwargs['start']
        history_plotters.Setup(self.train_cost_histories, self.train_count_histories, self.valid_cost_histories,
                               self.valid_count_histories, start)


if __name__ == "__main__":
    datapath = '../mlrefined_datasets/nonlinear_superlearn_datasets/noisy_sin_sample.csv'
    plotter = Visualizer(datapath)
    layer_sizes = [1, 10, 10, 10, 1]
    ES = Early_Stop(filename=datapath, layer_size=layer_sizes)
