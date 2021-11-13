# import custom library
import copy
import autograd.numpy as np

# custom lib
from . import basic_runner

### compare grad descent runs - given cost to counting cost ###
def train(x,y,feature_transforms,**kwargs):
    # get and run optimizer to solve two-class problem
    N = np.shape(x)[0]
    C = np.size(np.unique(y))
    max_its = 100; 
    alpha_choice = 1; 
    cost_name = 'softmax';
    normalize = 'standard'
    w = 0.1*np.random.randn(N+1,1); 
    
    # switches for user choices
    if 'max_its' in kwargs:
        max_its = kwargs['max_its']
    if 'alpha_choice' in kwargs:
        alpha_choice = kwargs['alpha_choice']
    if 'cost_name' in kwargs:
        cost_name = kwargs['cost_name']
    if 'w' in kwargs:
        w = kwargs['w']
    if 'normalize' in kwargs:
        normalize = kwargs['normalize']

    # loop over subproblems and solve
    weight_histories = []
    for c in range(0,C):
        # prepare temporary C vs notC sub-probem labels
        y_temp = copy.deepcopy(y)
        ind = np.argwhere(y_temp.astype(int) == c)
        ind = ind[:,1]
        ind2 = np.argwhere(y_temp.astype(int) != c)
        ind2 = ind2[:,1]
        y_temp[0,ind] = 1
        y_temp[0,ind2] = -1
        
        # run on normalized data
        run = basic_runner.Setup(x,y_temp,feature_transforms,cost_name,normalize = normalize)
        run.fit(w=w,alpha_choice = alpha_choice,max_its = max_its)
        
        # store each weight history
        weight_histories.append(run.weight_history)
        
    # combine each individual classifier weights into single weight 
    # matrix per step
    R = len(weight_histories[0])
    combined_weights = []
    for r in range(R):
        a = []
        for c in range(C):
            a.append(weight_histories[c][r])
        a = np.array(a).T
        a = a[0,:,:]
        combined_weights.append(a)
        
    # run combined weight matrices through fusion rule to calculate
    # number of misclassifications per step
    counter = basic_runner.Setup(x,y,feature_transforms,'multiclass_counter',normalize = normalize).cost_func
    count_history = [counter(v) for v in combined_weights]
        
    return combined_weights, count_history