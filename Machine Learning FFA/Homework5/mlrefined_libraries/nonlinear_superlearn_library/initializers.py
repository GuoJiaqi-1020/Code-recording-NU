# import autograd functionality
import autograd.numpy as np

# create initial weights for arbitrary feedforward network
def initialize_network_weights(layer_sizes, scale,**kwargs):
    distribution = 'normal'
    if 'distribution' in kwargs:
        distribution = kwargs['distribution']
        
    # container for entire weight tensor
    weights = []
    if distribution == 'normal':
        # loop over desired layer sizes and create appropriately sized initial 
        # weight matrix for each layer
        for k in range(len(layer_sizes)-1):
            # get layer sizes for current weight matrix
            U_k = layer_sizes[k]
            U_k_plus_1 = layer_sizes[k+1]

            # make weight matrix
            weight = scale*np.random.randn(U_k+1,U_k_plus_1)
            weights.append(weight)

        # re-express weights so that w_init[0] = omega_inner contains all 
        # internal weight matrices, and w_init = w contains weights of 
        # final linear combination in predict function
        w_init = [weights[:-1],weights[-1]]
     
    if distribution == 'uniform':
        # loop over desired layer sizes and create appropriately sized initial 
        # weight matrix for each layer
        for k in range(len(layer_sizes)-1):
            # get layer sizes for current weight matrix
            U_k = layer_sizes[k]
            U_k_plus_1 = layer_sizes[k+1]

            # make weight matrix
            weight = scale*np.random.rand(U_k+1,U_k_plus_1)
            weights.append(weight)

        # re-express weights so that w_init[0] = omega_inner contains all 
        # internal weight matrices, and w_init = w contains weights of 
        # final linear combination in predict function
        w_init = [weights[:-1],weights[-1]]
    
    return w_init