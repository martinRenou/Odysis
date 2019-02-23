import os.path as osp
from array import array
import vtk

FLOAT32 = 'f'
UINT32 = 'I'

# TODO Find a generic way to triangulate datasets
# The bruteforce way would be to loop through the vtkCells
# and using the triangulate method in order to generate tetrahedrons and triangles:
# https://vtk.org/doc/nightly/html/classvtkCell.html#afece9607d75536910a3d0b154383d641
#
# We could also try to convert the grid to vtkPolyData and use vtkQuadricClustering
# in order to simplify it


def filter_grid(grid, filter_function):
    filter = filter_function()
    filter.SetInputData(grid)
    filter.Update()
    filtered = filter.GetOutput()

    return filtered


def geometry_filter(grid):
    return filter_grid(grid, vtk.vtkGeometryFilter)


def append_filter(grid):
    return filter_grid(grid, vtk.vtkAppendFilter)


def get_ugrid_vertices(grid):
    dtype = FLOAT32
    nb_vertices = grid.GetNumberOfPoints()
    vertices = grid.GetPoints()
    if not vertices:
        raise Exception('No vertices specified, nothing to display')

    out = array(dtype)
    for i in range(nb_vertices):
        out.extend(vertices.GetPoint(i))
    return out


def get_ugrid_tetras(grid):
    dtype = UINT32

    # vtkCellIterator
    iterator = grid.NewCellIterator()
    iterator.InitTraversal()

    out = array(dtype)
    while not iterator.IsDoneWithTraversal():
        # Ignore 0D, 1D and 2D cells
        if iterator.GetCellDimension() != 3:
            iterator.GoToNextCell()
            continue

        # TODO: Support of other cell types, playing with indices to
        # create tetrahedrons. By using vtkCell.triangulate?
        if iterator.GetCellType() == vtk.VTK_TETRA:
            out.extend(iterator.GetPointIds())
        elif iterator.GetCellType() == vtk.VTK_QUADRATIC_TETRA:
            points = iterator.GetPointIds()
            out.extend([points.GetId(0), points.GetId(4),
                       points.GetId(6), points.GetId(7)])

            out.extend([points.GetId(1), points.GetId(4),
                       points.GetId(5), points.GetId(8)])

            out.extend([points.GetId(2), points.GetId(5),
                       points.GetId(6), points.GetId(9)])

            out.extend([points.GetId(3), points.GetId(7),
                       points.GetId(8), points.GetId(9)])

            out.extend([points.GetId(6), points.GetId(4),
                       points.GetId(7), points.GetId(8)])

            out.extend([points.GetId(4), points.GetId(5),
                       points.GetId(6), points.GetId(8)])

            out.extend([points.GetId(5), points.GetId(8),
                       points.GetId(9), points.GetId(6)])

            out.extend([points.GetId(6), points.GetId(7),
                       points.GetId(8), points.GetId(9)])

        iterator.GoToNextCell()

    return out


def get_ugrid_faces(grid):
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

        if nb_points == 4:
            out.extend([points.GetId(0), points.GetId(1), points.GetId(2)])
            out.extend([points.GetId(0), points.GetId(2), points.GetId(3)])
        else:
            out.extend(map(points.GetId, range(nb_points)))

    return out


def get_ugrid_data(grid):
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


def load_vtk(filepath):
    file_extension = osp.splitext(filepath)[1]
    if file_extension == '.vtu':
        reader = vtk.vtkXMLUnstructuredGridReader()
        reader.SetFileName(filepath)
        reader.Update()
        grid = reader.GetOutput()

        return grid
    elif file_extension == '.vtk':
        reader = vtk.vtkDataSetReader()
        reader.SetFileName(filepath)
        reader.Update()

        if reader.GetUnstructuredGridOutput() is not None:
            return reader.GetUnstructuredGridOutput()

        elif reader.GetPolyDataOutput() is not None:
            raise RuntimeError('PolyData not supported (yet?)')

        elif reader.GetStructuredPointsOutput() is not None:
            raise RuntimeError('StructuredPoints not supported (yet?)')

        elif reader.GetStructuredGridOutput() is not None:
            filtered = append_filter(reader.GetStructuredGridOutput())
            return filtered

        elif reader.GetRectilinearGridOutput() is not None:
            raise RuntimeError('RectilinearGrid not supported (yet?)')

        else:
            raise RuntimeError('Unrecognized data type')
    else:
        raise RuntimeError('Unknown file type {}'.format(file_extension))
