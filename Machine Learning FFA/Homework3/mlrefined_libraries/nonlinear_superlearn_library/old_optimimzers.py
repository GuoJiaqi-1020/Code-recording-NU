# clear display
from IPython.display import clear_output
import matplotlib.pyplot as plt

# import autograd functionality
from autograd import grad as compute_grad   # The only autograd function you may ever need
import autograd.numpy as np
from autograd import hessian as compute_hess
import math
import time
import copy

from autograd.misc.flatten import flatten_func
 
class MyOptimizers:
    '''
    A list of current optimizers.  In each case - since these are used for educational purposes - the weights at each step are recorded and returned.
    '''

    ### gradient descent ###
    def gradient_descent(self,g,w,**kwargs):    
        # flatten function
        self.g, unflatten, w = flatten_func(g, w)
        self.grad = compute_grad(self.g)
        
        # parse optional arguments        
        max_its = 100
        if 'max_its' in kwargs:
            max_its = kwargs['max_its']
        version = 'unnormalized'
        if 'version' in kwargs:
            version = kwargs['version']
        alpha = 10**-4
        if 'alpha' in kwargs:
            alpha = kwargs['alpha']
        steplength_rule = 'none'    
        if 'steplength_rule' in kwargs:
            steplength_rule = kwargs['steplength_rule']
        projection = 'None'
        if 'projection' in kwargs:
            projection = kwargs['projection']
        output = 'history'
        if 'output' in kwargs:
            output = kwargs['output']
        diminish_num = 10
        if 'diminish_num' in kwargs:
            diminish_num = kwargs['diminish_num']
        verbose = True
        if 'verbose' in kwargs:
            verbose = kwargs['verbose']
       
        # create container for weight history 
        w_hist = []
        g_best = np.inf
        w_best = unflatten(copy.deepcopy(w))
        
        if output == 'history':
            w_hist.append(unflatten(w))
        
        # start gradient descent loop
        if verbose == True:
            print ('starting optimization...')
        d = 1        # diminish count
        for k in range(max_its):   
            # plug in value into func and derivative
            grad_eval = self.grad(w)
            grad_eval.shape = np.shape(w)
            
            ### normalized or unnormalized descent step? ###
            if version == 'normalized':
                grad_norm = np.linalg.norm(grad_eval)
                if grad_norm == 0:
                    grad_norm += 10**-6*np.sign(2*np.random.rand(1) - 1)
                grad_eval /= grad_norm
            
            ### decide on steplength parameter alpha ###
            # a fixed step?
            # alpha = alpha
            
            # print out progress
            if np.mod(k,100) == 0 and k > 0:
                print (str(k) + ' of ' + str(max_its) + ' iterations complete')
            
            # use backtracking line search?
            if steplength_rule == 'backtracking':
                alpha = self.backtracking(w,grad_eval)
                
            # use a pre-set diminishing steplength parameter?
            if steplength_rule == 'diminishing':
                alpha = 1/(float(d))
                if np.mod(k,diminish_num) == 0 and k > 0:
                    d += 1
            
            ### take gradient descent step ###
            w = w - alpha*grad_eval

            ### projection? ###
            if 'projection' in kwargs:
                w = projection(w)
            
            # record weight for history
            if output == 'history':
                w_hist.append(unflatten(w))     
            if output == 'best':
                if self.g(w) < g_best:
                    g_best = self.g(w)
                    w_best = unflatten(w)
                    
        if verbose == True:
            print ('...optimization complete!')
            time.sleep(1.5)
            clear_output()
        
        # return
        if output == 'history':
            return w_hist
        if output == 'best':
            return w_best
 
    # backtracking linesearch module
    def backtracking(self,w,grad_eval):
        # set input parameters
        alpha = 1
        t = 0.8
        
        # compute initial function and gradient values
        func_eval = self.g(w)
        grad_norm = np.linalg.norm(grad_eval)**2
        
        # loop over and tune steplength
        while self.g(w - alpha*grad_eval) > func_eval - alpha*0.5*grad_norm:
            alpha = t*alpha
        return alpha
            
    #### newton's method ####            
    def newtons_method(self,g,win,**kwargs):        
        # flatten gradient for simpler-written descent loop
        self.g, unflatten, w = flatten_func(g, win)
        
        self.grad = compute_grad(self.g)
        self.hess = compute_hess(self.g)  
        
        # parse optional arguments        
        max_its = 20
        if 'max_its' in kwargs:
            max_its = kwargs['max_its']
        self.epsilon = 10**-10
        if 'epsilon' in kwargs:
            self.epsilon = kwargs['epsilon']
        verbose = True
        if 'verbose' in kwargs:
            verbose = kwargs['verbose']
        output = 'history'
        if 'output' in kwargs:
            output = kwargs['output']
        self.counter = copy.deepcopy(self.g)
        if 'counter' in kwargs:
            counter = kwargs['counter']
            self.counter, unflatten, w = flatten_func(counter, win)
            
        # create container for weight history 
        w_hist = []
        w_hist.append(unflatten(copy.deepcopy(w)))
        
        # start newton's method loop   
        if verbose == True:
            print ('starting optimization...')
        geval_old = self.g(w)
        
        self.w_best = unflatten(copy.deepcopy(w))
        g_best = self.counter(w)

        w_hist = []
        if output == 'history':
            w_hist.append(unflatten(w))
        
        # loop
        for k in range(max_its):
            # compute gradient and hessian
            grad_val = self.grad(w)
            hess_val = self.hess(w)
            hess_val.shape = (np.size(w),np.size(w))

            # solve linear system for weights
            C = hess_val + self.epsilon*np.eye(np.size(w))
            w = np.linalg.solve(C, np.dot(C,w) - grad_val)

            # eject from process if reaching singular system
            geval_new = self.g(w)
            if k > 2 and geval_new > geval_old:
                print ('singular system reached')
                time.sleep(1.5)
                clear_output()
                if output == 'history':
                    return w_hist
                elif output == 'best':
                    return self.w_best
            else:
                geval_old = geval_new
                
            # record current weights
            if output == 'best':
                if self.g(w) < g_best:
                    g_best = self.counter(w)

                    self.w_best = copy.deepcopy(unflatten(w))
                    
            w_hist.append(unflatten(w))
            
        if verbose == True:
            print ('...optimization complete!')
            time.sleep(1.5)
            clear_output()
        if output == 'best':
            return self.w_best
        elif output == 'history':
            return w_hist
    
    
    # plot the cost function weight history
    def plot_cost_history(self,w_history):
        self.cost_vals = []
        for weights in w_history:
            self.cost_vals.append(self.counter(weights))
        fig = plt.figure(figsize = (4,4))
        ax = plt.subplot(111)
        ax.plot(self.cost_vals)
        plt.show()   

