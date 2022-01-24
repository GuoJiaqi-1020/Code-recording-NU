import sys
import autograd.numpy as np
from matplotlib import pyplot as plt, gridspec

from mlrefined_libraries.multilayer_perceptron_library.basic_lib import super_cost_functions, multilayer_perceptron, \
    super_optimizers

sys.path.append('../')


class two_class_classifation_CNN:
    def __init__(self, filename, layer_size):
        data = np.loadtxt(filename, delimiter=",")
        # define the parameter
        self.weight_histories = []
        self.train_cost_histories = []
        self.train_accuracy_histories = []
        self.val_cost_histories = []
        self.val_accuracy_histories = []
        self.train_costs = []
        self.train_counts = []
        self.val_costs = []
        self.val_counts = []
        # training process
        self.fetch_data(data.T)
        self.data_preprocess()
        self.split_dataset(train_portion=1)
        self.define_cost_function()
        self.parameter_setting(feature_name='multilayer_softmax', layer_sizes=layer_size, activation='tanh', scale=0.5)
        self.fit()
        # ploting parameter
        self.colors = ['orchid', 'b']
        self.plot_hist()

    def fetch_data(self, data):
        self.x = data[:, :-1].T
        y = data[:, -1]
        self.y = y[np.newaxis, :]

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

    def define_cost_function(self):
        self.cost_name = 'softmax'
        self.cost_object = super_cost_functions.Setup(self.cost_name)
        self.count_object = super_cost_functions.Setup('twoclass_counter')

    def parameter_setting(self, **kwargs):
        layer_sizes = [1]
        if 'layer_sizes' in kwargs:
            layer_sizes = kwargs['layer_sizes']
        input_size = self.x.shape[0]
        layer_sizes.insert(0, input_size)
        num_labels = len(np.unique(self.y))
        if num_labels == 2:
            layer_sizes.append(1)
        else:
            layer_sizes.append(num_labels)
        transformer = multilayer_perceptron.Setup(**kwargs)
        self.feature_transforms = transformer.feature_transforms
        self.multilayer_initializer = transformer.initializer
        self.layer_sizes = transformer.layer_sizes
        if 'name' in kwargs:
            self.feature_name = kwargs['feature_name']
        self.cost_object.define_feature_transform(self.feature_transforms)
        self.cost = self.cost_object.cost
        self.model = self.cost_object.model
        self.count_object.define_feature_transform(self.feature_transforms)
        self.counter = self.count_object.cost

    def fit(self):
        self.max_its = 300
        self.alpha_choice = 1
        self.w_init = self.multilayer_initializer()
        self.train_num = np.size(self.y_train)
        self.val_num = np.size(self.y_val)
        self.batch_size = np.size(self.y_train)
        weight_history, train_cost_history, val_cost_history = super_optimizers.gradient_descent(self.cost,
                                                                                                 self.w_init,
                                                                                                 self.x_train,
                                                                                                 self.y_train,
                                                                                                 self.x_val,
                                                                                                 self.y_val,
                                                                                                 self.alpha_choice,
                                                                                                 self.max_its,
                                                                                                 self.batch_size,
                                                                                                 'standard',
                                                                                                 verbose="True")
        self.weight_histories.append(weight_history)
        self.train_cost_histories.append(train_cost_history)
        self.val_cost_histories.append(val_cost_history)
        train_accuracy_history = [1 - self.counter(v, self.x_train, self.y_train) / float(self.y_train.size) for v
                                  in weight_history]
        val_accuracy_history = [1 - self.counter(v, self.x_val, self.y_val) / float(self.y_val.size) for v in
                                weight_history]

        self.train_accuracy_histories.append(train_accuracy_history)
        self.val_accuracy_histories.append(val_accuracy_history)

    def plot_fun(self, train_cost_histories, train_accuracy_histories, val_cost_histories, val_accuracy_histories,
                 start):
        fig = plt.figure(figsize=(15, 4.5))
        gs = gridspec.GridSpec(1, 2)
        ax1 = plt.subplot(gs[0])
        ax2 = plt.subplot(gs[1])
        for c in range(len(train_cost_histories)):
            train_cost_history = train_cost_histories[c]
            train_accuracy_history = train_accuracy_histories[c]
            val_cost_history = val_cost_histories[c]
            val_accuracy_history = val_accuracy_histories[c]
            ax1.plot(np.arange(start, len(train_cost_history), 1), train_cost_history[start:],
                     linewidth=3 * 0.6 ** c, color=self.colors[1])
            ax2.plot(np.arange(start, len(train_accuracy_history), 1), train_accuracy_history[start:],
                     linewidth=3 * 0.6 ** c, color=self.colors[1], label='Training set')
            if np.size(val_cost_history) > 0:
                ax1.plot(np.arange(start, len(val_cost_history), 1), val_cost_history[start:],
                         linewidth=3 * 0.8 ** c, color=self.colors[1])
                ax2.plot(np.arange(start, len(val_accuracy_history), 1), val_accuracy_history[start:],
                         linewidth=3 * 0.8 ** c, color=self.colors[1], label='validation')
        xlabel = 'Step $k$'
        ylabel = r'$g\left({\mathbf{\Theta}}^k\right)$'
        ax1.set_xlabel(xlabel, fontsize=14)
        ax1.set_ylabel(ylabel, fontsize=14, rotation=0, labelpad=25)
        title = 'Cost History'
        ax1.set_title(title, fontsize=15)
        ylabel = 'Accuracy'
        ax2.set_xlabel(xlabel, fontsize=14)
        ax2.set_ylabel(ylabel, fontsize=14, rotation=90, labelpad=10)
        title = 'Accuracy History'
        ax2.set_title(title, fontsize=15)
        anchor = (1, 1)
        plt.legend(loc='lower right')  # bbox_to_anchor=anchor)
        ax1.set_xlim([start - 0.5, len(train_cost_history) - 0.5])
        ax2.set_xlim([start - 0.5, len(train_cost_history) - 0.5])
        ax2.set_ylim([0, 1.05])
        plt.show()

    def plot_hist(self):
        start = 0
        if self.train_portion == 1:
            self.val_cost_histories = [[] for s in range(len(self.val_cost_histories))]
            self.val_accuracy_histories = [[] for s in range(len(self.val_accuracy_histories))]
        self.plot_fun(self.train_cost_histories, self.train_accuracy_histories, self.val_cost_histories,
                      self.val_accuracy_histories, start)


if __name__ == "__main__":
    datapath = '../mlrefined_datasets/nonlinear_superlearn_datasets/2_eggs.csv'
    layer_sizes = [10, 10, 10, 10]
    CNN2 = two_class_classifation_CNN(filename=datapath, layer_size=layer_sizes)
