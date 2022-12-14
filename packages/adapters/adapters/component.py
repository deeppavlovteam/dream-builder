import os, shutil
from typing import List
from pathlib import Path

from adapters.registry import get_component_data_adapter
from cotypes.adapters import Resources, FilesDict
from cotypes.common import Component

def _read_files(dir_path: Path, ignore_dirs: List[str] = []) -> FilesDict:
    files_dict = {}
    for root, _, files in os.walk(dir_path):
        if Path(root).name in ignore_dirs:
            continue
        for filename in files:
            abs_path = os.path.join(root, filename)
            file_path = os.path.relpath(abs_path, dir_path)
            with open(abs_path) as f:
                try:
                    files_dict[file_path] = f.read()
                except UnicodeDecodeError:
                    pass
    return files_dict

def _write_files(file_dict: FilesDict, dir_path: Path):
    for rel_path, file_cont in file_dict.items():
        path = dir_path / rel_path
        print(f"Writing {path.name}:\n", file_cont)
        with open(path, 'w') as f:
            f.write(file_cont)

def import_component(comp_root: Path, comp_type: str):
    Adapter = get_component_data_adapter(comp_type)
    files_dict = _read_files(comp_root / 'data')
    adapter = Adapter.from_files(files_dict)
    return adapter.data

def export_component(comp: Component, data: Resources, comp_root: Path):
    Adapter = get_component_data_adapter(comp.type)
    adapter = Adapter.from_data(data)
    data_dir = comp_root / 'data'
    if data_dir.exists():
        shutil.rmtree(data_dir)
    os.makedirs(data_dir)
    _write_files(adapter.files, data_dir)
    root_files = _read_files(comp_root, ignore_dirs=['data', 'model'])
    modified_files = adapter.override_configs(root_files)
    _write_files(modified_files, comp_root)
    
