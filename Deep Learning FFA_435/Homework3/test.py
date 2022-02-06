import sys
import autograd.numpy as np
from matplotlib import pyplot as plt, gridspec
import mlrefined_libraries.multilayer_perceptron_library as multi
from mlrefined_libraries.multilayer_perceptron_library.basic_lib import multilayer_perceptron, unsuper_cost_functions, \
    unsuper_optimizers
from mlrefined_libraries.multilayer_perceptron_library.basic_lib.unsuper_setup import Setup

from sklearn.datasets import fetch_openml

x, y = fetch_openml('mnist_784', version=1, return_X_y=True)

# convert string labels to integers
y = np.array([int(v) for v in y])[np.newaxis, :]

num_sample = 50000
inds = np.random.permutation(y.shape[1])[:num_sample]
x_sample = np.array(x.T)[:, inds]
y_sample = y[:, inds]

mylib = multi.basic_lib.super_setup.Setup(x_sample, y_sample)

# perform preprocessing step(s) - especially input normalization
mylib.preprocessing_steps(normalizer='standard')

# split into training and validation sets
mylib.make_train_val_split(train_portion=1)

# choose cost
mylib.choose_cost(name='multiclass_softmax')

# choose dimensions of fully connected multilayer perceptron layers
layer_sizes = [10, 10, 10, 10]
mylib.choose_features(feature_name='multilayer_perceptron', layer_sizes=layer_sizes, activation='relu', scale=0.1)
mylib.fit(max_its=10, alpha_choice=10 ** (-2), verbose=False, batch_size=200)

# component-wise normalized version
mylib.choose_features(feature_name='multilayer_perceptron_batch_normalized', layer_sizes=layer_sizes, activation='relu',
                      scale=0.1)
mylib.fit(max_its=10, alpha_choice=10 ** (-1), verbose=False, w_init=mylib.w_init, batch_size=200)

# plot cost function history
labels = ['regular', 'batch-normalized']
mylib.show_multirun_histories(start=0, labels=labels)
