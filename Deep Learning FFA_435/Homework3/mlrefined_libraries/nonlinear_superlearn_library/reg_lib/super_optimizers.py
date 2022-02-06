import autograd.numpy as np
from autograd import value_and_grad
from autograd import hessian
from autograd.misc.flatten import flatten_func
from IPython.display import clear_output
from timeit import default_timer as timer
import time


# minibatch gradient descent
def RMSprop(g, w, x_train, y_train, x_val, y_val, alpha, max_its, batch_size, verbose, lam):
    # rmsprop params
    gamma = 0.9
    eps = 10 ** -8

    # flatten the input function, create gradient based on flat function
    g_flat, unflatten, w = flatten_func(g, w)
    grad = value_and_grad(g_flat)

    # initialize average gradient
    avg_sq_grad = np.ones(np.size(w))

    # record history
    num_train = y_train.size
    num_val = y_val.size
    w_hist = [unflatten(w)]
    train_hist = [g_flat(w, x_train, y_train, np.arange(num_train))]
    val_hist = []
    if num_val > 0:
        val_hist.append(g_flat(w, x_val, y_val, np.arange(num_val)))

    # how many mini-batches equal the entire dataset?
    num_batches = int(np.ceil(np.divide(num_train, batch_size)))

    # over the line
    for k in range(max_its):
        # loop over each minibatch
        start = timer()
        train_cost = 0
        for b in range(num_batches):
            # collect indices of current mini-batch
            batch_inds = np.arange(b * batch_size, min((b + 1) * batch_size, num_train))

            # plug in value into func and derivative
            cost_eval, grad_eval = grad(w, x_train, y_train, batch_inds)
            grad_eval.shape = np.shape(w)

            # check if regularizer is added
            if lam > 0:
                grad_eval += 2 * lam / float(len(batch_inds)) * w

            # update exponential average of past gradients
            avg_sq_grad = gamma * avg_sq_grad + (1 - gamma) * grad_eval ** 2

            # take descent step 
            w = w - alpha * grad_eval / (avg_sq_grad ** (0.5) + eps)

        end = timer()

        # update training and validation cost
        train_cost = g_flat(w, x_train, y_train, np.arange(num_train))
        val_cost = np.nan
        if num_val > 0:
            val_cost = g_flat(w, x_val, y_val, np.arange(num_val))
            val_hist.append(val_cost)

        # record weight update, train and val costs
        w_hist.append(unflatten(w))
        train_hist.append(train_cost)

        if verbose == True:
            print('step ' + str(k + 1) + ' done in ' + str(np.round(end - start, 1)) + ' secs, train cost = ' + str(
                np.round(train_hist[-1][0], 4)) + ', val cost = ' + str(np.round(val_hist[-1][0], 4)))

    if verbose == True:
        print('finished all ' + str(max_its) + ' steps')
        # time.sleep(1.5)
        # clear_output()
    return w_hist, train_hist, val_hist


# newtons method function - inputs: g (input function), max_its (maximum number of iterations), w (initialization)
def newtons_method(g, w, x_train, y_train, x_val, y_val, alpha, max_its, batch_size, verbose, lam, epsilon):
    # flatten input funciton, in case it takes in matrices of weights
    g_flat, unflatten, w = flatten_func(g, w)

    # an Automatic Differntiator to evaluate the gradient)
    grad = value_and_grad(g_flat)
    hess = hessian(g_flat)

    # record history
    num_train = y_train.size
    num_val = y_val.size
    w_hist = [unflatten(w)]
    train_hist = [g_flat(w, x_train, y_train, np.arange(num_train))]
    val_hist = []
    if num_val > 0:
        val_hist.append(g_flat(w, x_val, y_val, np.arange(num_val)))

    # how many mini-batches equal the entire dataset?
    num_batches = int(np.ceil(np.divide(num_train, batch_size)))

    # over the line
    for k in range(max_its):
        # loop over each minibatch
        start = timer()
        train_cost = 0
        for b in range(num_batches):
            # collect indices of current mini-batch
            batch_inds = np.arange(b * batch_size, min((b + 1) * batch_size, num_train))

            # evaluate the gradient, store current weights and cost function value
            cost_eval, grad_eval = grad(w, x_train, y_train, batch_inds)

            # evaluate the hessian
            hess_eval = hess(w, x_train, y_train, batch_inds)

            # check if regularizer is added
            if lam > 0:
                grad_eval += 2 * lam / float(len(batch_inds)) * w
                hess_eval += 2 * lam * np.eye(np.size(w))

            # reshape for numpy linalg functionality
            hess_eval.shape = (int((np.size(hess_eval)) ** (0.5)), int((np.size(hess_eval)) ** (0.5)))
            hess_eval += epsilon * np.eye(np.size(w))

            # solve second order system system for weight update
            A = hess_eval
            b = grad_eval
            w = np.linalg.lstsq(A, np.dot(A, w) - b)[0]

            # w = w - np.dot(np.linalg.pinv(A),b)

        end = timer()

        # update training and validation cost
        train_cost = g_flat(w, x_train, y_train, np.arange(num_train))
        val_cost = np.nan
        if num_val > 0:
            val_cost = g_flat(w, x_val, y_val, np.arange(num_val))
            val_hist.append(val_cost)

        # record weight update, train and val costs
        w_hist.append(unflatten(w))
        train_hist.append(train_cost)

        if np.linalg.norm(w) > 100:
            return w_hist, train_hist, val_hist

        if verbose == True:
            print('step ' + str(k + 1) + ' done in ' + str(np.round(end - start, 1)) + ' secs, train cost = ' + str(
                np.round(train_hist[-1][0], 4)) + ', val cost = ' + str(np.round(val_hist[-1][0], 4)))

    if verbose == True:
        print('finished all ' + str(max_its) + ' steps')
        # time.sleep(1.5)
        # clear_output()
    return w_hist, train_hist, val_hist
