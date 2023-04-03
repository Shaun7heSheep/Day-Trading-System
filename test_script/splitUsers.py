import sys

testFile = sys.argv[1]
print(testFile)
with open(testFile, 'r') as file:
    lines = file.readlines()

# Create a dictionary to keep track of file handles for each identifier
file_handles = {}

for line in lines:
    components = line.strip().split(',')
    #print(components)
    #command_type = components[0]
    identifier = components[1]
    #value = float(components[2])
    
    # Check if there's already a file handle for this identifier
    if identifier in file_handles:
        file_handle = file_handles[identifier]
    else:
        # If not, create a new file for this identifier and store its handle in the dictionary
        filename = f"text_files/{identifier}.txt"
        file_handle = open(filename, 'w')
        file_handles[identifier] = file_handle
    
    # Write the command to the file for this identifier
    file_handle.write(line)
    
# Close all the file handles
for file_handle in file_handles.values():
    file_handle.close()
