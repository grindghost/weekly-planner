import os

def collect_files(directory, output_file, include_js):
    with open(output_file, 'w') as outfile:
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith('.vue') or (include_js and file.endswith('.js')):
                    file_path = os.path.join(root, file)
                    # Compute the relative path from the given directory
                    relative_path = os.path.relpath(file_path, directory)
                    with open(file_path, 'r') as infile:
                        outfile.write(f"{relative_path}:\n")
                        outfile.write(infile.read())
                        outfile.write("\n\n**\n\n")

if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser(description='Collect all .vue (and optionally .js) files in a project and copy their content into a text file.')
    parser.add_argument('directory', type=str, help='The root directory of the project to search.')
    parser.add_argument('--include-js', action='store_true', help='Include .js files in addition to .vue files.')

    args = parser.parse_args()

    # Use the specified directory to save the ZOURKI.txt file
    output_file = Path(args.directory) / '_ALL_CODE.txt'

    collect_files(args.directory, output_file, args.include_js)
