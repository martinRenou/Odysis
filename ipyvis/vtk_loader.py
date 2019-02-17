import os.path as osp
from array import array
import itertools as it
import vtk

FLOAT32 = 'f'
UINT32 = 'I'


def filter_grid(grid, filter_function):
    filter = filter_function()
    filter.SetInputData(grid)
    filter.Update()
    filtered = filter.GetOutput()

    return filtered


def triangle_filter(grid):
    return filter_grid(grid, vtk.vtkTriangleFilter)


def geometry_filter(grid):
    return filter_grid(grid, vtk.vtkGeometryFilter)


def get_vertices(grid):
    dtype = FLOAT32
    nb_vertices = grid.GetNumberOfPoints()
    vertices = grid.GetPoints()
    if not vertices:
        raise Exception('No vertices specified, nothing to display')

    out = array(dtype)
    for i in range(nb_vertices):
        out.extend(vertices.GetPoint(i))
    return out


def get_tetras(grid):
    dtype = UINT32
    nb_cells = grid.GetNumberOfCells()

    out = array(dtype)
    if not getattr(grid, 'GetCells', False):
        return out
    cells = grid.GetCells()
    if not cells:
        return out
    points = vtk.vtkIdList()

    for _ in range(nb_cells):
        cells.GetNextCell(points)
        nb_points = points.GetNumberOfIds()
        # TODO: Support of other cell types, playing with indices to
        # create tetrahedrons

        # See https://www.math.u-bordeaux.fr/~mleguebe/docs/file-formats.pdf
        # page 9 and 10 for cell types

        tetras = []

        # nb_points == 4 => TETRA
        if nb_points == 4:
            tetras += it.imap(points.GetId, range(4))

        # nb_points == 10 => QUADRATIC_TETRA
        if nb_points == 10:
            tetras += [points.GetId(0), points.GetId(4),
                       points.GetId(6), points.GetId(7)]

            tetras += [points.GetId(1), points.GetId(4),
                       points.GetId(5), points.GetId(8)]

            tetras += [points.GetId(2), points.GetId(5),
                       points.GetId(6), points.GetId(9)]

            tetras += [points.GetId(3), points.GetId(7),
                       points.GetId(8), points.GetId(9)]

            tetras += [points.GetId(6), points.GetId(4),
                       points.GetId(7), points.GetId(8)]

            tetras += [points.GetId(4), points.GetId(5),
                       points.GetId(6), points.GetId(8)]

            tetras += [points.GetId(5), points.GetId(8),
                       points.GetId(9), points.GetId(6)]

            tetras += [points.GetId(6), points.GetId(7),
                       points.GetId(8), points.GetId(9)]

        out.extend(tetras)

    return out


def get_faces(grid):
    dtype = UINT32

    filtered = geometry_filter(grid)

    nb_polys = filtered.GetNumberOfPolys()
    polys = filtered.GetPolys()
    out = array(dtype)
    if not polys:
        return out
    points = vtk.vtkIdList()

    for _ in range(nb_polys):
        polys.GetNextCell(points)
        nb_points = points.GetNumberOfIds()
        out.extend(map(points.GetId, range(nb_points)))

    return out


def get_data(grid):
    dtype = FLOAT32
    # Get data from the grid
    data = grid.GetPointData()
    out = {}
    if not data:
        return out
    nb_values = data.GetNumberOfTuples()

    # Export each array of data, and export the data description
    nb_arr = data.GetNumberOfArrays()
    for i_arr in range(nb_arr):
        arr = data.GetArray(i_arr)
        arr_name = arr.GetName()
        components = {}
        nb_components = arr.GetNumberOfComponents()

        # Get magnitude min and max
        mag_min, mag_max = arr.GetRange(-1)

        # For each component of the array of data
        for i_comp in range(nb_components):
            component_name = arr.GetComponentName(i_comp)
            component_name = 'X' + str(i_comp+1) if component_name is None else component_name
            component_min, component_max = arr.GetRange(i_comp)

            values = (arr.GetComponent(i_value, i_comp) for i_value in range(nb_values))

            components[component_name] = {
              'array': array(dtype, values),
              'min': component_min,
              'max': component_max
            }

        out[arr_name] = components

    # Export the data description
    return out


def get_untructured_grid_repr(grid):
    tetras = get_tetras(grid)
    vertices = get_vertices(grid)
    data = get_data(grid)
    faces = get_faces(grid)

    return {
        'vertices': vertices,
        'tetras': tetras,
        'faces': faces,
        'data': data
    }


def load_vtk(filepath):
    file_extension = osp.splitext(filepath)[1]
    if file_extension == '.vtu':
        reader = vtk.vtkXMLUnstructuredGridReader()
        reader.SetFileName(filepath)
        reader.Update()
        grid = reader.GetOutput()

        return get_untructured_grid_repr(grid)
    elif file_extension == '.vtk':
        reader = vtk.vtkDataSetReader()
        reader.SetFileName(filepath)
        reader.Update()

        if reader.GetUnstructuredGridOutput() is not None:
            return get_untructured_grid_repr(
                reader.GetUnstructuredGridOutput()
            )
        elif reader.GetPolyDataOutput() is not None:
            raise RuntimeError('PolyData not supported (yet?)')
        elif reader.GetStructuredPointsOutput() is not None:
            raise RuntimeError('StructuredPoints not supported (yet?)')
        elif reader.GetStructuredGridOutput() is not None:
            raise RuntimeError('StructuredGrid not supported (yet?)')
        elif reader.GetRectilinearGridOutput() is not None:
            raise RuntimeError('RectilinearGrid not supported (yet?)')
        else:
            raise RuntimeError('Unrecognized data type')
    else:
        raise RuntimeError('Unknown file type {}'.format(file_extension))
