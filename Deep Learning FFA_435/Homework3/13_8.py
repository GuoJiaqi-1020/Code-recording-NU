import sys
import autograd.numpy as np
from sklearn.datasets import fetch_openml
from mlrefined_libraries.multilayer_perceptron_library.basic_lib import multilayer_perceptron, super_cost_functions, \
    super_optimizers, multilayer_perceptron_batch_normalized, history_plotters, multirun_history_plotters

sys.path.append('../')


class Batch_normalization:
    def __init__(self, x_sample, y_sample, layer_size):
        self.x = x_sample
        self.y = y_sample
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
        self.train_main(layer_size)

    def train_main(self, layer_size):
        self.data_preprocess()
        self.split_dataset(train_portion=1)
        self.cost_fun()
        # Without batch normalization
        self.parameter_setting(feature_name='multilayer_perceptron', layer_sizes=layer_size,
                               activation='relu', scale=0.1)
        self.fit(max_its=10, alpha_choice=30 ** (-2), verbose=False, batch_size=200)

        # With batch normalization
        self.parameter_setting(feature_name='multilayer_perceptron_batch_normalized', layer_sizes=layer_size,
                               activation='relu', scale=0.1)
        self.fit(max_its=10, alpha_choice=10 ** (-1), verbose=False, w_init=self.w_init, batch_size=200)
        self.show_history(start=0, labels=['regular', 'batch-normalized'])

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

    def cost_fun(self):
        self.cost_name = 'multiclass_softmax'
        self.cost_object = super_cost_functions.Setup(self.cost_name)
        self.count_object = super_cost_functions.Setup('multiclass_counter')

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
        feature_name = 'multilayer_perceptron'
        if 'name' in kwargs:
            feature_name = kwargs['feature_name']

        if feature_name == 'multilayer_perceptron':
            transformer = multilayer_perceptron.Setup(**kwargs)
            self.feature_transforms = transformer.feature_transforms
            self.multilayer_initializer = transformer.initializer
            self.layer_sizes = transformer.layer_sizes

        if feature_name == 'multilayer_perceptron_batch_normalized':
            transformer = multilayer_perceptron_batch_normalized.Setup(**kwargs)
            self.feature_transforms = transformer.feature_transforms
            self.multilayer_initializer = transformer.initializer
            self.layer_sizes = transformer.layer_sizes

        self.feature_name = feature_name
        self.cost_object.define_feature_transform(self.feature_transforms)
        self.cost = self.cost_object.cost
        self.model = self.cost_object.model
        self.count_object.define_feature_transform(self.feature_transforms)
        self.counter = self.count_object.cost

    def fit(self, **kwargs):
        max_its = 100
        alpha_choice = 10 ** (-1)
        if 'max_its' in kwargs:
            self.max_its = kwargs['max_its']
        if 'alpha_choice' in kwargs:
            self.alpha_choice = kwargs['alpha_choice']
        if 'w_init' in kwargs:
            self.w_init = kwargs['w_init']
        else:
            self.w_init = self.multilayer_initializer()
        self.train_num = np.size(self.y_train)
        self.val_num = np.size(self.y_val)
        self.batch_size = np.size(self.y_train)
        if 'batch_size' in kwargs:
            self.batch_size = min(kwargs['batch_size'], self.batch_size)
        verbose = False
        version = 'standard'
        weight_history, train_cost_history, val_cost_history = super_optimizers.gradient_descent(self.cost,
                                                                                                 self.w_init,
                                                                                                 self.x_train,
                                                                                                 self.y_train,
                                                                                                 self.x_val,
                                                                                                 self.y_val,
                                                                                                 self.alpha_choice,
                                                                                                 self.max_its,
                                                                                                 self.batch_size,
                                                                                                 version,
                                                                                                 verbose=verbose)
        self.weight_histories.append(weight_history)
        self.train_cost_histories.append(train_cost_history)
        self.val_cost_histories.append(val_cost_history)
        if self.cost_name == 'softmax' or self.cost_name == 'perceptron' or self.cost_name == 'multiclass_softmax' or self.cost_name == 'multiclass_perceptron':
            train_accuracy_history = [1 - self.counter(v, self.x_train, self.y_train) / float(self.y_train.size) for v
                                      in weight_history]
            val_accuracy_history = [1 - self.counter(v, self.x_val, self.y_val) / float(self.y_val.size) for v in
                                    weight_history]

            # store count history
            self.train_accuracy_histories.append(train_accuracy_history)
            self.val_accuracy_histories.append(val_accuracy_history)

    def show_history(self, start, labels, **kwargs):
        multirun_history_plotters.Setup(self.train_cost_histories, self.train_accuracy_histories, start, labels)


if __name__ == "__main__":
    layer_sizes = [10, 10, 10, 10]
    x, y = fetch_openml('mnist_784', version=1, return_X_y=True)
    y = np.array([int(v) for v in y])[np.newaxis, :]
    num_sample = 50000
    inds = np.random.permutation(y.shape[1])[:num_sample]
    x_sample = np.array(x.T)[:, inds]
    y_sample = y[:, inds]
    print("input shape = ", x_sample.shape)
    print("output shape = ", y_sample.shape)
    NA = Batch_normalization(x_sample, y_sample, layer_sizes)
