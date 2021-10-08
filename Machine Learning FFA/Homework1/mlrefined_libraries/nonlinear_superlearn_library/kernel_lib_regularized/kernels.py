import autograd.numpy as np
from scipy.spatial.distance import cdist

class Setup:
    def __init__(self,name,**kwargs):         
        # define kernel            
        if name == 'polys':
            self.kernel = self.kernel_poly
            
        if name == 'fourier':
            self.kernel = self.kernel_fourier   

        if name == 'gaussian':
            self.kernel = self.kernel_gaussian   
            
        ### set hyperparameters of kernel ###
        # degree of polynomial
        self.D = 2
        if 'degree' in kwargs:
            self.D = kwargs['degree']
            
        self.beta = 0.1
        if 'beta' in kwargs:
            self.beta = kwargs['beta']
            
    # poly kernel
    def kernel_poly(self,x1,x2):    
        H = (1 + np.dot(x1.T,x2))**self.D - 1
        return H.T
    
    # fourier kernel
    def kernel_fourier(self,x1,x2):    
        # loop over both matrices and create fourier kernel
        num_cols1 = x1.shape[1]
        num_cols2 = x2.shape[1]
        H = np.zeros((num_cols1,num_cols2))
        for n in range(num_cols1):
            for m in range(num_cols2):
                val = np.pi*(x1[:,n] - x2[:,m])                
                ind = np.argwhere(val == 0)
                val[ind] += 10**(-10)
                val1 = np.sin((2*self.D + 1)*val)
                val2 = np.sin(val)
                val3 = np.prod(val1/val2,0) - 1
                H[n,m] = val3
        return H.T
    
    # gaussian kernel
    def kernel_gaussian(self,x1,x2):  
        dist = cdist(x1.T, x2.T, metric='euclidean')**2
        H = np.exp(-self.beta*dist)
        return H.T